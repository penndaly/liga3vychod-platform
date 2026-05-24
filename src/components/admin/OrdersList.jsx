import { useState, useEffect, useMemo } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../services/firebase'
import {
  Search, Eye, RefreshCw, Printer, Loader, ClipboardList,
} from 'lucide-react'
import OrderDetailsModal from './OrderDetailsModal'
import UpdateOrderStatus from './UpdateOrderStatus'

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CFG = {
  new:        { label: 'Nová',        cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
  processing: { label: 'Spracúva sa', cls: 'bg-blue-500/20   text-blue-400   border border-blue-500/30'    },
  shipped:    { label: 'Odoslaná',    cls: 'bg-purple-500/20 text-purple-400 border border-purple-500/30'  },
  delivered:  { label: 'Doručená',    cls: 'bg-slate-600     text-slate-300  border border-slate-500'      },
  cancelled:  { label: 'Zrušená',     cls: 'bg-red-500/20    text-red-400    border border-red-500/30'     },
  pending:    { label: 'Čaká',        cls: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' },
  paid:       { label: 'Zaplatená',   cls: 'bg-green-500/20  text-green-400  border border-green-500/30'  },
  completed:  { label: 'Dokončená',   cls: 'bg-slate-600     text-slate-300  border border-slate-500'      },
}

const FILTER_TABS = [
  { value: null,         label: 'Všetky'     },
  { value: 'new',        label: 'Nové'       },
  { value: 'processing', label: 'Spracúva sa'},
  { value: 'shipped',    label: 'Odoslaná'   },
  { value: 'delivered',  label: 'Doručená'   },
  { value: 'cancelled',  label: 'Zrušená'    },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('sk-SK', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function summariseItems(items = []) {
  if (!items.length) return '—'
  const parts = items.map((it) => {
    // Use just the last two words of the product name to keep it short
    const name = (it.productName ?? it.productId ?? '').split(' ').slice(-2).join(' ')
    return it.size ? `${name} (${it.size})` : name
  })
  if (parts.length <= 2) return parts.join(' + ')
  return `${parts[0]} + ${parts.length - 1} ďalšie`
}

function printInvoice(order) {
  const rows = (order.items ?? []).map((it) =>
    `<tr>
      <td>${it.productName ?? it.productId}</td>
      <td style="text-align:center">${it.size ?? '—'}</td>
      <td style="text-align:center">${it.quantity ?? 1}</td>
      <td style="text-align:right">${(it.price ?? 0).toFixed(2)} €</td>
      <td style="text-align:right">${((it.price ?? 0) * (it.quantity ?? 1)).toFixed(2)} €</td>
    </tr>`
  ).join('')
  const w = window.open('', '_blank')
  w.document.write(`<!doctype html><html>
  <head><title>Faktúra #${order.orderNumber ?? order.id}</title>
  <style>
    body{font-family:sans-serif;padding:40px}
    table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}
    th,td{padding:8px 10px;border:1px solid #ddd}th{background:#f5f5f5;font-size:11px;text-transform:uppercase}
    .total{font-weight:bold;font-size:15px}
  </style></head><body>
  <h2>Faktúra #${order.orderNumber ?? order.id}</h2>
  <p><strong>${order.customerName ?? ''}</strong><br>${order.customerEmail ?? ''}</p>
  <p>${order.shippingAddress?.street ?? ''}, ${order.shippingAddress?.city ?? ''} ${order.shippingAddress?.postalCode ?? ''}</p>
  <table><thead><tr><th>Produkt</th><th>Veľ.</th><th>Ks</th><th>Cena/ks</th><th>Spolu</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <p style="text-align:right;margin-top:12px">Doprava: ${(order.shipping ?? 0).toFixed(2)} €</p>
  <p class="total" style="text-align:right">Celkom: ${(order.total ?? 0).toFixed(2)} €</p>
  <script>window.onload=()=>{window.print();window.close()}<\/script>
  </body></html>`)
  w.document.close()
}

// ── Component ──────────────────────────────────────────────────────────────
/**
 * @param {string}   clubId     – numeric club id as string
 * @param {string}   clubColor  – hex colour for accents
 * @param {function} onNewCount – called with the count of 'new' orders (for tab badge)
 */
export default function OrdersList({ clubId, clubColor, onNewCount }) {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [statusF,  setStatusF]  = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [viewing,  setViewing]  = useState(null)   // order for OrderDetailsModal
  const [updating, setUpdating] = useState(null)   // order for inline UpdateOrderStatus

  // ── Real-time listener ──────────────────────────────────────────────────
  useEffect(() => {
    if (!clubId) return
    const unsub = onSnapshot(
      query(collection(db, 'clubs', clubId, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setOrders(docs)
        setLoading(false)
        onNewCount?.(docs.filter((o) => o.status === 'new').length)
      },
      () => setLoading(false)
    )
    return unsub
  }, [clubId, onNewCount])

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter((o) => {
      if (statusF && o.status !== statusF) return false
      if (q) {
        const matchNum  = (o.orderNumber ?? o.id).toLowerCase().includes(q)
        const matchName = (o.customerName ?? '').toLowerCase().includes(q)
        if (!matchNum && !matchName) return false
      }
      if (dateFrom && o.createdAt) {
        const d = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
        if (d < new Date(dateFrom)) return false
      }
      if (dateTo && o.createdAt) {
        const d   = o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)
        const end = new Date(dateTo); end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }, [orders, statusF, search, dateFrom, dateTo])

  const newCount = orders.filter((o) => o.status === 'new').length

  // ── Sync updated order back into local state ─────────────────────────────
  function handleOrderUpdate(updated) {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o))
    // If the details modal is showing this order, refresh it too
    if (viewing?.id === updated.id) setViewing(updated)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader size={20} className="animate-spin text-slate-600" />
    </div>
  )

  return (
    <>
      <div className="space-y-4">

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Hľadať č. objednávky alebo meno zákazníka…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>

          {/* Date range */}
          <div className="flex gap-2 items-center shrink-0">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-yellow-400 transition-colors"
            />
            <span className="text-slate-700 text-xs">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
        </div>

        {/* ── Status filter pills ── */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map(({ value, label }) => (
            <button
              key={String(value)}
              onClick={() => setStatusF(value)}
              className={`relative text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                statusF === value ? 'text-slate-950' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              style={statusF === value ? { background: clubColor } : {}}
            >
              {label}
              {value === 'new' && newCount > 0 && (
                <span className="ml-1.5 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {newCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Table / empty state ── */}
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center py-24 text-slate-700">
            <ClipboardList size={32} className="mb-3" />
            <p className="text-sm font-black uppercase tracking-widest mb-1">
              {orders.length === 0 ? 'Žiadne objednávky' : 'Žiadne výsledky'}
            </p>
            <p className="text-xs">
              {orders.length === 0
                ? 'Objednávky sa zobrazia tu po integrácii platobnej brány'
                : 'Skúste iný filter alebo vyhľadávanie'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-600 font-black uppercase tracking-widest">
                    <th className="text-left  px-5 py-3">Objednávka</th>
                    <th className="text-left  px-3 py-3">Dátum</th>
                    <th className="text-left  px-3 py-3">Zákazník</th>
                    <th className="text-left  px-3 py-3 hidden md:table-cell">Položky</th>
                    <th className="text-right px-3 py-3">Celkom</th>
                    <th className="text-left  px-4 py-3">Stav</th>
                    <th className="text-right px-5 py-3">Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => {
                    const isNew = o.status === 'new'
                    return (
                      <tr
                        key={o.id}
                        className={`border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors ${
                          isNew ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        {/* Order # */}
                        <td className={`px-5 py-3 font-mono text-xs ${isNew ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                          #{o.orderNumber ?? o.id.slice(0, 8).toUpperCase()}
                        </td>
                        {/* Date */}
                        <td className="px-3 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {fmtDate(o.createdAt)}
                        </td>
                        {/* Customer */}
                        <td className={`px-3 py-3 text-xs ${isNew ? 'font-bold text-slate-200' : 'text-slate-400'}`}>
                          {o.customerName ?? '—'}
                        </td>
                        {/* Items summary */}
                        <td className="px-3 py-3 text-xs text-slate-500 max-w-[200px] truncate hidden md:table-cell">
                          {summariseItems(o.items)}
                        </td>
                        {/* Total */}
                        <td className={`px-3 py-3 text-right text-xs whitespace-nowrap ${isNew ? 'font-black text-white' : 'font-bold text-slate-300'}`}>
                          {o.total != null ? `${o.total.toFixed(2)} €` : '—'}
                        </td>
                        {/* Status badge */}
                        <td className="px-4 py-3">
                          <StatusBadge status={o.status} />
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setViewing(o)}
                              title="Zobraziť detail"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-yellow-400 hover:bg-slate-800 transition-colors"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => setUpdating(o)}
                              title="Aktualizovať stav"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                            >
                              <RefreshCw size={13} />
                            </button>
                            <button
                              onClick={() => printInvoice(o)}
                              title="Tlačiť faktúru"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-slate-800 text-[10px] text-slate-600 font-bold">
              {filtered.length} objednávok
              {filtered.length !== orders.length && ` (filtrovaných z ${orders.length})`}
            </div>
          </div>
        )}
      </div>

      {/* ── Order details drawer ── */}
      {viewing && (
        <OrderDetailsModal
          order={viewing}
          clubId={clubId}
          clubColor={clubColor}
          onClose={() => setViewing(null)}
          onOrderUpdate={handleOrderUpdate}
        />
      )}

      {/* ── Inline status update modal ── */}
      {updating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2,6,23,.75)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setUpdating(null) }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              Objednávka #{updating.orderNumber ?? updating.id.slice(0, 8).toUpperCase()}
            </p>
            <UpdateOrderStatus
              order={updating}
              clubId={clubId}
              onUpdate={(updated) => { handleOrderUpdate(updated); setUpdating(null) }}
              onClose={() => setUpdating(null)}
            />
          </div>
        </div>
      )}
    </>
  )
}
