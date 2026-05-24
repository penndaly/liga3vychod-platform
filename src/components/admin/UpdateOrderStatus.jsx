import { useState } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '../../services/firebase'
import { reduceProductStock } from '../../utils/reduceProductStock'
import { ChevronRight, Package, Truck, CheckCircle, XCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  new:        { label: 'Nová',        icon: Package,      color: 'text-yellow-400' },
  processing: { label: 'Spracúva sa', icon: Package,      color: 'text-blue-400'   },
  shipped:    { label: 'Odoslaná',    icon: Truck,        color: 'text-purple-400' },
  delivered:  { label: 'Doručená',    icon: CheckCircle,  color: 'text-green-400'  },
  cancelled:  { label: 'Zrušená',     icon: XCircle,      color: 'text-red-400'    },
}

// Valid next statuses from each state
const TRANSITIONS = {
  new:        ['processing', 'cancelled'],
  processing: ['shipped',    'cancelled'],
  shipped:    ['delivered',  'cancelled'],
  delivered:  [],
  cancelled:  [],
  // legacy statuses from older public-form orders
  pending:    ['processing', 'cancelled'],
  paid:       ['processing', 'shipped',  'cancelled'],
  completed:  [],
}

const CARRIERS = [
  'Slovenská pošta',
  'GLS',
  'DPD',
  'DHL',
  'UPS',
  'Packeta',
  'Kuriér',
]

const INPUT = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-yellow-400/50 transition-colors'

export default function UpdateOrderStatus({ order, clubId, onUpdate, onClose }) {
  const current = order.status ?? 'new'
  const next    = TRANSITIONS[current] ?? []

  const [status,          setStatus]          = useState(current)
  const [trackingNumber,  setTrackingNumber]  = useState(order.trackingNumber ?? '')
  const [carrier,         setCarrier]         = useState(order.carrier ?? '')
  const [estimatedDate,   setEstimatedDate]   = useState('')
  const [sendEmail,       setSendEmail]       = useState(true)
  const [notes,           setNotes]           = useState('')
  const [saving,          setSaving]          = useState(false)

  const changed  = status !== current
  const shipping = status === 'shipped'

  async function save() {
    if (!changed) { onClose(); return }
    setSaving(true)
    try {
      const ref  = doc(db, 'clubs', String(clubId), 'orders', order.id)
      const now  = serverTimestamp()

      const updates = {
        status,
        updatedAt: now,
        [`timeline.${status}`]: now,
      }

      if (shipping) {
        if (trackingNumber.trim()) updates.trackingNumber = trackingNumber.trim()
        if (carrier.trim())        updates.carrier        = carrier.trim()
        if (estimatedDate)         updates.estimatedDelivery = estimatedDate
      }

      if (notes.trim()) updates.adminNotes = notes.trim()

      await updateDoc(ref, updates)

      // Reduce stock when order moves to processing
      if (status === 'processing') {
        try {
          await reduceProductStock(order.id, String(clubId))
        } catch (err) {
          // Non-fatal — log but don't block the status update
          console.warn('reduceProductStock failed:', err.message)
        }
      }

      // Send email notification via Cloud Function
      if (sendEmail && status !== 'cancelled') {
        try {
          const fn = httpsCallable(getFunctions(), 'sendOrderStatusEmail')
          await fn({ orderId: order.id, clubSlug: order.clubSlug ?? clubId, newStatus: status })
        } catch (err) {
          // Non-fatal — CF may not be deployed yet
          console.warn('sendOrderStatusEmail CF failed:', err.message)
        }
      }

      toast.success('Stav objednávky bol aktualizovaný')

      onUpdate?.({
        ...order,
        status,
        trackingNumber: shipping && trackingNumber.trim() ? trackingNumber.trim() : order.trackingNumber,
        carrier:        shipping && carrier.trim()        ? carrier.trim()        : order.carrier,
        adminNotes:     notes.trim()                      ? notes.trim()          : order.adminNotes,
      })

      onClose?.()
    } catch {
      toast.error('Chyba pri aktualizácii stavu')
    } finally {
      setSaving(false)
    }
  }

  if (next.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-500">
        Objednávka je vo finálnom stave a nie je možné ju ďalej upravovať.
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Current → next flow */}
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
          Zmeniť stav objednávky
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400">
            <span>{STATUS_CONFIG[current]?.label ?? current}</span>
            <ChevronRight size={10} className="text-slate-600" />
          </div>
          {next.map((s) => {
            const cfg    = STATUS_CONFIG[s]
            const Icon   = cfg.icon
            const active = status === s
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                  active
                    ? 'bg-yellow-400 text-slate-950 border-yellow-400'
                    : s === 'cancelled'
                      ? 'bg-slate-800 border-red-900/50 text-red-400 hover:border-red-500'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <Icon size={12} /> {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Shipping fields — only shown when transitioning to "shipped" */}
      {shipping && (
        <div className="space-y-3 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Informácie o doručení
          </p>

          {/* Tracking number */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Číslo zásielky
            </label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="napr. SK123456789"
              className={`${INPUT} font-mono`}
            />
          </div>

          {/* Carrier */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Dopravca
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className={INPUT}
            >
              <option value="">— Vybrať dopravcu —</option>
              {CARRIERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Estimated delivery */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Predpokladaný dátum doručenia
            </label>
            <input
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              className={INPUT}
            />
          </div>

          {/* Send email checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-3.5 h-3.5 accent-yellow-400 rounded"
            />
            <span className="text-xs text-slate-300">
              Odoslať zákazníkovi e-mail s číslom zásielky
            </span>
          </label>
        </div>
      )}

      {/* Email notification for other statuses */}
      {!shipping && status !== 'cancelled' && changed && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="w-3.5 h-3.5 accent-yellow-400 rounded"
          />
          <span className="text-xs text-slate-300">
            Odoslať zákazníkovi e-mail o zmene stavu
          </span>
        </label>
      )}

      {/* Internal note */}
      <div>
        <label className="block text-xs font-bold text-slate-400 mb-1.5">
          Interná poznámka
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Voliteľná poznámka pre tím…"
          className={`${INPUT} resize-none`}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving || !changed}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-yellow-400 text-slate-950 text-xs font-black disabled:opacity-40 transition-opacity"
        >
          {saving && <Loader size={12} className="animate-spin" />}
          Uložiť zmenu
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold hover:text-slate-200 transition-colors"
        >
          Zrušiť
        </button>
      </div>
    </div>
  )
}
