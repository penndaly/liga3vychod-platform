import { useState } from 'react'
import { X, User, MapPin, Package, CreditCard, Clock, FileText, Printer, Mail } from 'lucide-react'
import UpdateOrderStatus from './UpdateOrderStatus'

// ── Shared config ─────────────────────────────────────────────────────────
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

const TIMELINE_STEPS = [
  { key: 'new',        label: 'Objednávka prijatá'        },
  { key: 'processing', label: 'Platba overená / spracovanie' },
  { key: 'shipped',    label: 'Odoslaná'                  },
  { key: 'delivered',  label: 'Doručená'                  },
]

const PAYMENT_LABEL = {
  card:             'Karta',
  bank_transfer:    'Bankový prevod',
  cash_on_delivery: 'Dobierka',
}

const PAYMENT_STATUS = {
  pending:  { label: 'Čaká na platbu', cls: 'text-yellow-400' },
  paid:     { label: 'Zaplatené',      cls: 'text-green-400'  },
  refunded: { label: 'Vrátené',        cls: 'text-red-400'    },
}

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtDateTime(ts) {
  if (!ts) return null
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('sk-SK', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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
    body { font-family: sans-serif; padding: 40px; color: #111; }
    h2   { margin-bottom: 4px; }
    p    { margin: 2px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
    th,td { padding: 8px 10px; border: 1px solid #ddd; }
    th    { background: #f5f5f5; text-align: left; font-size: 11px; text-transform: uppercase; }
    .totals { margin-top: 16px; text-align: right; font-size: 13px; }
    .grand  { font-size: 16px; font-weight: bold; margin-top: 6px; }
  </style>
  </head>
  <body>
    <h2>Faktúra #${order.orderNumber ?? order.id}</h2>
    <p style="color:#777;font-size:12px">${fmtDateTime(order.createdAt) ?? ''}</p>
    <br>
    <p><strong>${order.customerName ?? ''}</strong></p>
    <p>${order.customerEmail ?? ''}</p>
    <p>${order.customerPhone ?? ''}</p>
    <p style="margin-top:8px">
      ${order.shippingAddress?.street ?? ''},
      ${order.shippingAddress?.city ?? ''}
      ${order.shippingAddress?.postalCode ?? ''},
      ${order.shippingAddress?.country ?? 'Slovensko'}
    </p>
    <table>
      <thead><tr><th>Produkt</th><th>Veľ.</th><th>Ks</th><th>Cena/ks</th><th>Spolu</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <p>Medzisúčet: ${(order.subtotal ?? 0).toFixed(2)} €</p>
      <p>Doprava: ${(order.shipping ?? 0).toFixed(2)} €</p>
      <p class="grand">Celkom: ${(order.total ?? 0).toFixed(2)} €</p>
    </div>
    <script>window.onload = () => { window.print(); window.close() }<\/script>
  </body></html>`)
  w.document.close()
}

// ── Section header ────────────────────────────────────────────────────────
function SectionHead({ icon: Icon, label }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
      <Icon size={10} /> {label}
    </h3>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function OrderDetailsModal({
  order: initialOrder,
  clubId,
  clubColor,
  onClose,
  onOrderUpdate,
}) {
  const [order,      setOrder]      = useState(initialOrder)
  const [showStatus, setShowStatus] = useState(false)

  const s        = STATUS_CFG[order.status] ?? STATUS_CFG.pending
  const timeline = order.timeline ?? {}
  // 'new' timestamp falls back to createdAt if not explicitly set
  const newTs    = timeline.new ?? order.createdAt

  // Determine which timeline steps are complete
  const statusOrder = ['new', 'processing', 'shipped', 'delivered']
  const currentIdx  = statusOrder.indexOf(order.status)
  const completedSet = new Set(
    TIMELINE_STEPS
      .filter((_, i) => i <= currentIdx)
      .map(({ key }) => key)
  )
  // Also mark anything in the timeline object
  Object.entries(timeline).forEach(([k, v]) => { if (v) completedSet.add(k) })

  function handleOrderUpdate(updated) {
    setOrder(updated)
    onOrderUpdate?.(updated)
    setShowStatus(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-black text-white">
              #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.cls}`}>
              {s.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => printInvoice(order)}
              title="Tlačiť faktúru"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Printer size={14} />
            </button>
            <button
              onClick={() => window.open(
                `mailto:${order.customerEmail}?subject=Vaša objednávka %23${order.orderNumber ?? order.id}`
              )}
              title="Napísať zákazníkovi"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Mail size={14} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Customer */}
          <section>
            <SectionHead icon={User} label="Zákazník" />
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-1 text-xs">
              <p className="font-bold text-slate-200">{order.customerName ?? '—'}</p>
              <p className="text-slate-400">{order.customerEmail ?? '—'}</p>
              {order.customerPhone && (
                <p className="text-slate-400">{order.customerPhone}</p>
              )}
            </div>
          </section>

          {/* Shipping address */}
          {order.shippingAddress && (
            <section>
              <SectionHead icon={MapPin} label="Adresa doručenia" />
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-xs text-slate-300 space-y-0.5">
                <p>{order.shippingAddress.street}</p>
                <p>
                  {order.shippingAddress.city}
                  {order.shippingAddress.postalCode ? `, ${order.shippingAddress.postalCode}` : ''}
                </p>
                <p>{order.shippingAddress.country ?? 'Slovensko'}</p>
              </div>
            </section>
          )}

          {/* Items + payment summary */}
          <section>
            <SectionHead icon={Package} label="Položky" />
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[340px]">
                  <thead>
                    <tr className="border-b border-slate-700/50 text-[10px] text-slate-600 font-black uppercase tracking-widest">
                      <th className="text-left  px-4 py-2.5">Produkt</th>
                      <th className="text-center px-2 py-2.5">Veľ.</th>
                      <th className="text-center px-2 py-2.5">Ks</th>
                      <th className="text-right  px-4 py-2.5">Spolu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items ?? []).map((it, i) => (
                      <tr key={i} className="border-b border-slate-700/30 last:border-0">
                        <td className="px-4 py-2.5 text-slate-300">{it.productName ?? it.productId}</td>
                        <td className="px-2 py-2.5 text-center text-slate-500 font-mono">{it.size ?? '—'}</td>
                        <td className="px-2 py-2.5 text-center text-slate-400">×{it.quantity ?? 1}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-200">
                          {((it.price ?? 0) * (it.quantity ?? 1)).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-slate-700/50 px-4 py-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Medzisúčet</span>
                  <span>{(order.subtotal ?? 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Doprava</span>
                  <span>{(order.shipping ?? 0).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-black text-slate-100 text-sm pt-1 border-t border-slate-700/50">
                  <span>Celkom</span>
                  <span>{(order.total ?? 0).toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <SectionHead icon={CreditCard} label="Platba" />
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod ?? '—'}
              </span>
              <span className={`font-bold ${PAYMENT_STATUS[order.paymentStatus]?.cls ?? 'text-slate-400'}`}>
                {PAYMENT_STATUS[order.paymentStatus]?.label ?? order.paymentStatus ?? '—'}
              </span>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <SectionHead icon={Clock} label="Postup objednávky" />
            <div className="relative pl-6">
              {/* Vertical connector line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-800" />

              {order.status === 'cancelled' ? (
                <>
                  {/* Show completed steps before cancellation */}
                  {TIMELINE_STEPS.filter(({ key }) => completedSet.has(key) && key !== 'cancelled').map(({ key, label }) => {
                    const ts = key === 'new' ? newTs : timeline[key]
                    return (
                      <div key={key} className="relative mb-4">
                        <div
                          className="absolute -left-4 top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ background: clubColor }}
                        >
                          <span className="text-white text-[8px] font-black">✓</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400">{label}</p>
                        {ts && <p className="text-[10px] text-slate-600 mt-0.5">{fmtDateTime(ts)}</p>}
                      </div>
                    )
                  })}
                  {/* Cancelled step */}
                  <div className="relative mb-4">
                    <div className="absolute -left-4 top-0.5 w-3.5 h-3.5 rounded-full border-2 bg-red-500/20 border-red-500 flex items-center justify-center">
                      <span className="text-red-400 text-[8px] font-black">✕</span>
                    </div>
                    <p className="text-xs font-bold text-red-400">Objednávka zrušená</p>
                    {timeline.cancelled && (
                      <p className="text-[10px] text-slate-600 mt-0.5">{fmtDateTime(timeline.cancelled)}</p>
                    )}
                  </div>
                </>
              ) : (
                TIMELINE_STEPS.map(({ key, label }) => {
                  const done = completedSet.has(key)
                  const ts   = key === 'new' ? newTs : timeline[key]
                  return (
                    <div key={key} className="relative mb-4 last:mb-0">
                      <div
                        className={`absolute -left-4 top-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          done ? 'border-0' : 'bg-slate-900 border-slate-700'
                        }`}
                        style={done ? { background: clubColor } : {}}
                      >
                        {done && <span className="text-white text-[8px] font-black">✓</span>}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${done ? 'text-slate-200' : 'text-slate-600'}`}>
                          {label}
                        </p>
                        {done && ts && (
                          <p className="text-[10px] text-slate-600 mt-0.5">{fmtDateTime(ts)}</p>
                        )}
                        {/* Tracking number under the Shipped step */}
                        {key === 'shipped' && done && order.trackingNumber && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500">Číslo zásielky:</span>
                            <span className="text-[10px] font-mono text-slate-300">{order.trackingNumber}</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(order.trackingNumber)}
                              title="Kopírovať"
                              className="text-slate-600 hover:text-yellow-400 text-[10px] transition-colors"
                            >
                              ⧉
                            </button>
                          </div>
                        )}
                        {key === 'shipped' && done && order.carrier && (
                          <p className="text-[10px] text-slate-600 mt-0.5">{order.carrier}</p>
                        )}
                        {key === 'shipped' && done && order.estimatedDelivery && (
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            Est. doručenie: {order.estimatedDelivery}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Admin notes */}
          {order.adminNotes && (
            <section>
              <SectionHead icon={FileText} label="Interné poznámky" />
              <div className="bg-slate-800/50 border border-amber-900/30 rounded-xl p-4 text-xs text-slate-400 italic leading-relaxed">
                {order.adminNotes}
              </div>
            </section>
          )}

        </div>

        {/* ── Footer: status update ── */}
        <div className="border-t border-slate-800 px-6 py-4 shrink-0">
          {showStatus ? (
            <>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                Aktualizovať stav
              </p>
              <UpdateOrderStatus
                order={order}
                clubId={clubId}
                onUpdate={handleOrderUpdate}
                onClose={() => setShowStatus(false)}
              />
            </>
          ) : (
            <button
              onClick={() => setShowStatus(true)}
              className="w-full py-2.5 rounded-xl text-xs font-black text-slate-950 transition-opacity hover:opacity-90"
              style={{ background: clubColor }}
            >
              Aktualizovať stav objednávky
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
