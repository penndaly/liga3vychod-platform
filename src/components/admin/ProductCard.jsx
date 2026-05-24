import { Package, Star, Pencil, Trash2, Copy, Eye, EyeOff } from 'lucide-react'
import { totalStock, stockStatus } from '../../hooks/useProducts'

const CATEGORY_BADGE = {
  dresy:    'bg-blue-500/20   text-blue-400   border border-blue-500/25',
  doplnky:  'bg-purple-500/20 text-purple-400 border border-purple-500/25',
  listky:   'bg-orange-500/20 text-orange-400 border border-orange-500/25',
  clenstvo: 'bg-green-500/20  text-green-400  border border-green-500/25',
  ine:      'bg-slate-700     text-slate-400  border border-slate-600',
}
const CATEGORY_LABEL = {
  dresy: 'Dresy', doplnky: 'Doplnky', listky: 'Lístky', clenstvo: 'Členstvo', ine: 'Iné',
}

const STOCK_CFG = {
  out: { cls: 'bg-red-500/15 text-red-400 border border-red-500/25',    label: 'Vypredané' },
  low: { cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25', label: 'Málo kusov' },
  ok:  { cls: 'bg-green-500/15 text-green-400 border border-green-500/25',  label: 'Skladom' },
}

export default function ProductCard({ product, onEdit, onDelete, onDuplicate, onToggleActive }) {
  const total   = totalStock(product.stock)
  const status  = stockStatus(total)
  const stockCfg = STOCK_CFG[status]
  const catKey  = (product.category ?? '').toLowerCase().replace(/\s/g, '')
  const catCls  = CATEGORY_BADGE[catKey] ?? CATEGORY_BADGE.ine
  const catLabel = CATEGORY_LABEL[catKey] ?? (product.category ?? 'Iné')
  const firstImg = Array.isArray(product.images) ? product.images[0] : (product.imageUrl ?? null)

  return (
    <div className={`group bg-slate-900 border rounded-2xl overflow-hidden flex flex-col transition-all ${
      product.active === false ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-slate-700'
    }`}>

      {/* Image */}
      <div className="relative aspect-square bg-slate-800 overflow-hidden">
        {firstImg ? (
          <img
            src={firstImg}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-slate-600" />
          </div>
        )}

        {/* Featured star */}
        {product.featured && (
          <div className="absolute top-2 right-2 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <Star size={13} fill="currentColor" className="text-slate-950" />
          </div>
        )}

        {/* Active badge */}
        {product.active === false && (
          <div className="absolute top-2 left-2 bg-slate-900/80 border border-slate-700 text-slate-400 text-[9px] font-black px-2 py-0.5 rounded-full">
            NEAKTÍVNY
          </div>
        )}

        {/* Hover actions overlay */}
        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(product)}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center text-white transition-colors"
            title="Upraviť"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDuplicate(product)}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center text-white transition-colors"
            title="Duplikovať"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => onToggleActive(product.id, product.active !== false)}
            className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center text-white transition-colors"
            title={product.active === false ? 'Aktivovať' : 'Deaktivovať'}
          >
            {product.active === false ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="w-9 h-9 bg-red-500/30 hover:bg-red-500/50 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400 transition-colors"
            title="Odstrániť"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-black text-slate-100 leading-tight flex-1 min-w-0 truncate">
            {product.name}
          </p>
          <p className="text-sm font-black text-white shrink-0 tabular-nums">
            {Number(product.price || 0).toFixed(2)} €
          </p>
        </div>

        {product.name_en && (
          <p className="text-[10px] text-slate-600 truncate">{product.name_en}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${catCls}`}>
            {catLabel}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stockCfg.cls}`}>
            {status === 'ok' ? `${total} ks` : stockCfg.label}
          </span>
        </div>

        {/* Size stock breakdown */}
        {product.stock && typeof product.stock === 'object' && (
          <div className="flex gap-1.5 flex-wrap mt-1">
            {Object.entries(product.stock).filter(([, v]) => Number(v) > 0).map(([size, qty]) => (
              <span key={size} className="text-[9px] font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                {size}: {qty}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
