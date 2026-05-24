/**
 * OverlayEditor.jsx
 *
 * Three-panel visual editor for stream overlays.
 *
 * Layout:
 *   ┌──────────────┬──────────────────────────────┬──────────────┐
 *   │ Layers + Add │   Canvas  960×540 (0.5×)      │  Properties  │
 *   └──────────────┴──────────────────────────────┴──────────────┘
 *
 * Coordinates are stored in 1920×1080 space; SCALE=0.5 maps them to display.
 * Drag is implemented with plain mousedown/mousemove/mouseup — no Konva needed.
 * OBS integration: exports a self-contained HTML file that listens to
 *   clubs/{clubId}/broadcast/overlay in Firestore and re-renders live.
 */

import { useState, useCallback } from 'react'
import {
  collection, doc, setDoc, addDoc,
  getDocs, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db, firebaseConfig } from '../../services/firebase'
import OverlayScoreElement from './OverlayScoreElement'
import OverlayProperties   from './OverlayProperties'
import {
  Plus, Trash2, Eye, EyeOff, Save, Download, Copy,
  ChevronUp, ChevronDown, LayoutTemplate, Loader,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────
const CANVAS_W = 1920
const CANVAS_H = 1080
const SCALE    = 0.5   // display at 960×540

// ── Element type definitions ──────────────────────────────────────────────
const ELEMENT_TYPES = [
  { type: 'score',       label: 'Skóre',         icon: '⚽' },
  { type: 'lower_third', label: 'Lower third',   icon: '📋' },
  { type: 'text',        label: 'Text',           icon: 'T'  },
  { type: 'fixture',     label: 'Zápas (banner)', icon: '📅' },
  { type: 'sponsor',     label: 'Sponzor',        icon: '🏷'  },
]

// ── Default element factories ─────────────────────────────────────────────
function makeElement(type) {
  const base = {
    id:      `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    visible: true,
  }
  switch (type) {
    case 'score': return {
      ...base,
      x: 560, y: 30,
      width: 800, height: 90,
      homeTeam: 'Domáci tím', awayTeam: 'Hostia',
      homeScore: 0, awayScore: 0,
      time: "0'",
      homeBadgeUrl: '', awayBadgeUrl: '',
      backgroundColor: 'rgba(15,23,42,0.92)',
      textColor: '#ffffff',
    }
    case 'lower_third': return {
      ...base,
      x: 60, y: 880,
      width: 580, height: 90,
      title: 'Ján Novák',
      subtitle: 'Strelec · 23\'',
      accentColor: '#facc15',
      backgroundColor: 'rgba(15,23,42,0.88)',
      textColor: '#ffffff',
    }
    case 'text': return {
      ...base,
      x: 100, y: 500,
      width: 500, height: 80,
      text: 'Vlastný text',
      fontSize: 48,
      fontWeight: 'bold',
      textColor: '#ffffff',
      backgroundColor: 'transparent',
    }
    case 'fixture': return {
      ...base,
      x: 660, y: 900,
      width: 600, height: 120,
      homeTeam: 'MFK Snina',
      awayTeam: 'FK Humenné',
      datetime: 'So 5. 7. · 17:00',
      competition: 'Liga 3 Východ',
      backgroundColor: 'rgba(15,23,42,0.92)',
      textColor: '#ffffff',
    }
    case 'sponsor': return {
      ...base,
      x: 1680, y: 20,
      width: 220, height: 110,
      logoUrl: '',
      name: 'Sponzor',
      opacity: 0.9,
      backgroundColor: 'rgba(255,255,255,0.08)',
    }
    default: return base
  }
}

// ── Preset templates (full overlay combinations) ──────────────────────────
const TEMPLATES = [
  {
    id: 'match_basic',
    label: 'Zápas — základný',
    desc:  'Skóre + lower third',
    elements: () => [makeElement('score'), makeElement('lower_third')],
  },
  {
    id: 'score_only',
    label: 'Len skóre',
    desc:  'Minimalistický scoreboard',
    elements: () => [makeElement('score')],
  },
  {
    id: 'full_broadcast',
    label: 'Plný broadcast',
    desc:  'Skóre + lower third + sponzor',
    elements: () => [makeElement('score'), makeElement('lower_third'), makeElement('sponsor')],
  },
]

// ── Canvas element renderer (dispatches by type) ──────────────────────────
function CanvasElement({ el, scale, isSelected, onSelect, onChange }) {
  if (!el.visible) return null

  if (el.type === 'score') {
    return (
      <OverlayScoreElement
        element={el}
        scale={scale}
        isSelected={isSelected}
        onSelect={onSelect}
        onChange={onChange}
      />
    )
  }

  // Generic draggable renderer for lower_third, text, fixture, sponsor
  const x = Math.round(el.x * scale)
  const y = Math.round(el.y * scale)
  const w = Math.round(el.width  * scale)
  const h = Math.round(el.height * scale)

  function handleMouseDown(e) {
    e.stopPropagation()
    onSelect()
    const startX = e.clientX, startY = e.clientY
    const origX = el.x, origY = el.y
    function onMove(me) {
      onChange({
        x: Math.max(0, Math.min(CANVAS_W - el.width,  Math.round(origX + (me.clientX - startX) / scale))),
        y: Math.max(0, Math.min(CANVAS_H - el.height, Math.round(origY + (me.clientY - startY) / scale))),
      })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const borderRadius = Math.round(8 * scale)
  const bg = el.backgroundColor ?? 'rgba(15,23,42,0.88)'
  const fg = el.textColor ?? '#ffffff'
  const pad = Math.round(Math.min(w, h) * 0.12)

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h,
        background: bg,
        borderRadius,
        border: isSelected ? '2px solid #16a34a' : '2px solid rgba(255,255,255,0.08)',
        cursor: 'move', userSelect: 'none',
        overflow: 'hidden', boxSizing: 'border-box',
        padding: pad,
        opacity: el.opacity ?? 1,
      }}
    >
      {el.type === 'lower_third' && (
        <div style={{ display: 'flex', alignItems: 'stretch', height: '100%', gap: pad }}>
          <div style={{ width: 3, background: el.accentColor ?? '#facc15', borderRadius: 2, flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <p style={{ color: fg, fontWeight: 900, fontSize: Math.round(h * 0.28), margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {el.title || 'Meno hráča'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: Math.round(h * 0.18), margin: 0, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {el.subtitle || 'Pozícia'}
            </p>
          </div>
        </div>
      )}

      {el.type === 'text' && (
        <p style={{
          color: fg,
          fontSize: Math.round((el.fontSize ?? 48) * scale),
          fontWeight: el.fontWeight ?? 'bold',
          margin: 0, lineHeight: 1.2,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {el.text || 'Text'}
        </p>
      )}

      {el.type === 'fixture' && (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <p style={{ color: el.accentColor ?? '#facc15', fontSize: Math.round(h * 0.14), fontWeight: 900, margin: 0, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Nadchádzajúci zápas
          </p>
          <p style={{ color: fg, fontSize: Math.round(h * 0.24), fontWeight: 900, margin: 0, marginTop: 2 }}>
            {el.homeTeam} vs {el.awayTeam}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: Math.round(h * 0.16), margin: 0, marginTop: 2 }}>
            {el.datetime} · {el.competition}
          </p>
        </div>
      )}

      {el.type === 'sponsor' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 4 }}>
          {el.logoUrl
            ? <img src={el.logoUrl} alt={el.name} style={{ maxWidth: '100%', maxHeight: '75%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display='none' }} />
            : <div style={{ width: '60%', height: '55%', background: 'rgba(255,255,255,0.1)', borderRadius: 4, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize: Math.round(h*0.14), fontWeight:700 }}>LOGO</div>
          }
          {el.name && (
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: Math.round(h * 0.14), margin: 0, fontWeight: 700, textAlign: 'center' }}>
              {el.name}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── OBS HTML export ────────────────────────────────────────────────────────
function buildOBSHtml(elements, clubId) {
  const cfg = JSON.stringify(firebaseConfig)

  const elementCSS = `
    .overlay { position: absolute; inset: 0; }
    .score-bar {
      position: absolute; display: flex; align-items: center;
      background: rgba(15,23,42,0.92); border-radius: 8px;
      box-shadow: 0 4px 24px rgba(0,0,0,.6); overflow: hidden;
      padding: 0 16px; gap: 12px; box-sizing: border-box;
    }
    .score-bar .side { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .score-bar .side.right { flex-direction: row-reverse; }
    .score-bar .team-badge { width: 56px; height: 56px; object-fit: contain; border-radius: 4px; flex-shrink: 0; }
    .score-bar .team-name  { font-weight: 900; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .score-bar .score-col  { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; gap: 2px; }
    .score-bar .score-val  { font-weight: 900; color: #fff; letter-spacing: .05em; line-height: 1; }
    .score-bar .score-time { color: #facc15; font-weight: 700; line-height: 1; }
    .lower-third {
      position: absolute; display: flex; align-items: center;
      background: rgba(15,23,42,0.88); border-radius: 8px;
      padding: 12px 16px; gap: 10px; box-sizing: border-box;
    }
    .lower-third .accent-bar { width: 3px; align-self: stretch; border-radius: 2px; flex-shrink: 0; }
    .lower-third .lt-title   { font-weight: 900; color: #fff; font-size: 26px; line-height: 1.2; }
    .lower-third .lt-sub     { font-weight: 600; color: rgba(255,255,255,.6); font-size: 16px; margin-top: 2px; }
    .overlay-text { position: absolute; white-space: pre-wrap; word-break: break-word; }
    .fixture-banner {
      position: absolute; display: flex; flex-direction: column;
      justify-content: center; background: rgba(15,23,42,0.92);
      border-radius: 8px; padding: 14px 18px; box-sizing: border-box;
    }
    .fixture-banner .fb-label { color: #facc15; font-weight: 900; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; }
    .fixture-banner .fb-match { color: #fff; font-weight: 900; font-size: 22px; margin-top: 3px; }
    .fixture-banner .fb-info  { color: rgba(255,255,255,.55); font-size: 15px; margin-top: 3px; }
    .sponsor-box {
      position: absolute; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      background: rgba(255,255,255,.08); border-radius: 8px;
      padding: 8px; box-sizing: border-box;
    }
    .sponsor-box img    { max-width: 100%; max-height: 75%; object-fit: contain; }
    .sponsor-box .sp-name { color: rgba(255,255,255,.5); font-size: 13px; font-weight: 700; margin-top: 4px; text-align: center; }
  `

  const renderFn = `
    function renderElement(el) {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:'+el.x+'px;top:'+el.y+'px;width:'+el.width+'px;height:'+el.height+'px;';
      if (!el.visible) { d.style.display='none'; }
      if (el.type === 'score') {
        d.className = 'score-bar';
        const nameFs = (el.height * 0.22) + 'px';
        const scoreFs = (el.height * 0.36) + 'px';
        const timeFs = (el.height * 0.16) + 'px';
        const badge = (el.height * 0.65) + 'px';
        d.innerHTML =
          '<div class="side left">'+
            (el.homeBadgeUrl ? '<img src="'+el.homeBadgeUrl+'" class="team-badge">' : '')+
            '<span class="team-name" style="font-size:'+nameFs+'">'+el.homeTeam+'</span>'+
          '</div>'+
          '<div class="score-col">'+
            '<span class="score-val" style="font-size:'+scoreFs+'">'+el.homeScore+' — '+el.awayScore+'</span>'+
            '<span class="score-time" style="font-size:'+timeFs+'">'+el.time+'</span>'+
          '</div>'+
          '<div class="side right">'+
            '<span class="team-name" style="font-size:'+nameFs+'">'+el.awayTeam+'</span>'+
            (el.awayBadgeUrl ? '<img src="'+el.awayBadgeUrl+'" class="team-badge">' : '')+
          '</div>';
      } else if (el.type === 'lower_third') {
        d.className = 'lower-third';
        d.style.background = el.backgroundColor || 'rgba(15,23,42,0.88)';
        d.innerHTML =
          '<div class="accent-bar" style="background:'+(el.accentColor||'#facc15')+'"></div>'+
          '<div><div class="lt-title">'+el.title+'</div><div class="lt-sub">'+el.subtitle+'</div></div>';
      } else if (el.type === 'text') {
        d.className = 'overlay-text';
        d.style.cssText += 'color:'+(el.textColor||'#fff')+';font-size:'+(el.fontSize||48)+'px;font-weight:'+(el.fontWeight||'bold')+';background:'+(el.backgroundColor||'transparent')+';';
        d.textContent = el.text || '';
      } else if (el.type === 'fixture') {
        d.className = 'fixture-banner';
        d.innerHTML =
          '<div class="fb-label">Nadchádzajúci zápas</div>'+
          '<div class="fb-match">'+el.homeTeam+' vs '+el.awayTeam+'</div>'+
          '<div class="fb-info">'+el.datetime+' · '+el.competition+'</div>';
      } else if (el.type === 'sponsor') {
        d.className = 'sponsor-box';
        d.style.opacity = el.opacity || 1;
        d.innerHTML = (el.logoUrl ? '<img src="'+el.logoUrl+'" alt="'+el.name+'">' : '<div style="width:60%;height:55%;background:rgba(255,255,255,.1);border-radius:4px"></div>')+
          (el.name ? '<span class="sp-name">'+el.name+'</span>' : '');
      }
      return d;
    }
    function renderOverlay(elements) {
      const c = document.getElementById('overlay');
      c.innerHTML = '';
      (elements||[]).forEach(el => c.appendChild(renderElement(el)));
    }
  `

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1920px; height: 1080px; overflow: hidden; background: transparent; font-family: system-ui, -apple-system, sans-serif; }
    #overlay { position: relative; width: 1920px; height: 1080px; }
    ${elementCSS}
  </style>
</head>
<body>
  <div id="overlay"></div>

  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
  <script>
    firebase.initializeApp(${cfg});
    const db = firebase.firestore();

    ${renderFn}

    db.collection('clubs').doc('${clubId}')
      .collection('broadcast').doc('overlay')
      .onSnapshot(function(snap) {
        if (snap.exists) renderOverlay(snap.data().elements || []);
      });
  </script>
</body>
</html>`
}

// ── Main editor ────────────────────────────────────────────────────────────
export default function OverlayEditor({ clubId }) {
  const [elements,   setElements]   = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)

  const selectedElement = elements.find((el) => el.id === selectedId) ?? null

  // ── Element CRUD ──────────────────────────────────────────────────────────
  const addElement = useCallback((type) => {
    const el = makeElement(type)
    setElements((prev) => [...prev, el])
    setSelectedId(el.id)
  }, [])

  const updateElement = useCallback((id, patch) => {
    setElements((prev) => prev.map((el) => el.id === id ? { ...el, ...patch } : el))
  }, [])

  const deleteElement = useCallback((id) => {
    setElements((prev) => prev.filter((el) => el.id !== id))
    setSelectedId((s) => (s === id ? null : s))
  }, [])

  const moveLayer = useCallback((id, dir) => {
    setElements((prev) => {
      const idx = prev.findIndex((el) => el.id === id)
      if (idx === -1) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }, [])

  const toggleVisible = useCallback((id) => {
    setElements((prev) => prev.map((el) => el.id === id ? { ...el, visible: !el.visible } : el))
  }, [])

  // ── Firestore save ────────────────────────────────────────────────────────
  async function handleSave() {
    if (!clubId) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'clubs', clubId, 'broadcast', 'overlay'),
        { elements, updatedAt: serverTimestamp() },
        { merge: true }
      )
      toast.success('Overlay uložený')
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  // ── OBS HTML export ───────────────────────────────────────────────────────
  function handleExportOBS() {
    if (!clubId) { toast.error('clubId chýba'); return }
    const html = buildOBSHtml(elements, clubId)
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `overlay-${clubId}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('HTML overlay exportovaný')
  }

  // ── Apply template ────────────────────────────────────────────────────────
  function applyTemplate(tmpl) {
    // eslint-disable-next-line no-alert
    if (elements.length > 0 && !window.confirm('Nahradiť existujúce vrstvy šablónou?')) return
    const newEls = tmpl.elements()
    setElements(newEls)
    setSelectedId(newEls[0]?.id ?? null)
    setShowTemplates(false)
  }

  // ── Canvas background (dark + grid) ──────────────────────────────────────
  const displayW = Math.round(CANVAS_W * SCALE)
  const displayH = Math.round(CANVAS_H * SCALE)

  const LAYER_ICONS = {
    score: '⚽', lower_third: '📋', text: 'T', fixture: '📅', sponsor: '🏷',
  }

  return (
    <div className="flex flex-col gap-4 min-h-0">

      {/* ── Top toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowTemplates((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <LayoutTemplate size={12} /> Šablóny {showTemplates ? '▲' : '▼'}
        </button>

        <div className="w-px h-5 bg-slate-800" />

        {/* Add element buttons */}
        {ELEMENT_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => addElement(type)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            <Plus size={11} /> {icon} {label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleExportOBS}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <Download size={12} /> OBS HTML
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-yellow-400 text-slate-950 text-xs font-black disabled:opacity-50 hover:bg-yellow-300 transition-colors"
          >
            {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Ukladám…' : 'Uložiť'}
          </button>
        </div>
      </div>

      {/* ── Templates gallery ── */}
      {showTemplates && (
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => applyTemplate(tmpl)}
              className="flex flex-col items-start p-3 bg-slate-800 border border-slate-700 rounded-xl text-left hover:border-yellow-400/50 transition-colors group"
            >
              {/* Thumbnail placeholder */}
              <div className="w-full h-14 bg-slate-700 rounded-lg mb-2 flex items-center justify-center text-slate-500 text-xs font-bold group-hover:bg-slate-600 transition-colors">
                Náhľad
              </div>
              <p className="text-xs font-bold text-slate-200">{tmpl.label}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{tmpl.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Three-panel editor ── */}
      <div className="flex gap-4 min-h-0" style={{ height: displayH + 2 }}>

        {/* Left: Layers */}
        <div className="w-48 shrink-0 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-800 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Vrstvy ({elements.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {elements.length === 0 && (
              <div className="flex items-center justify-center h-full text-slate-700">
                <p className="text-[10px] font-bold text-center px-3">Pridajte prvok pomocou tlačidiel vyššie</p>
              </div>
            )}
            {/* Layers listed bottom-to-top (like real layer panels) */}
            {[...elements].reverse().map((el, revIdx) => {
              const realIdx = elements.length - 1 - revIdx
              const isActive = el.id === selectedId
              return (
                <div
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`flex items-center gap-2 px-2.5 py-2 cursor-pointer transition-colors group ${
                    isActive
                      ? 'bg-yellow-400/10 border-l-2 border-yellow-400'
                      : 'border-l-2 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <span className="text-sm shrink-0" title={el.type}>{LAYER_ICONS[el.type] ?? '□'}</span>
                  <span className={`flex-1 text-[11px] font-bold truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {ELEMENT_TYPES.find((t) => t.type === el.type)?.label ?? el.type}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisible(el.id) }}
                      className="p-0.5 text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      {el.visible ? <Eye size={10} /> : <EyeOff size={10} className="text-slate-700" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, -1) }} className="p-0.5 text-slate-600 hover:text-slate-300">
                      <ChevronUp size={10} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id,  1) }} className="p-0.5 text-slate-600 hover:text-slate-300">
                      <ChevronDown size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteElement(el.id) }}
                      className="p-0.5 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex items-start justify-center">
          <div
            style={{
              position:   'relative',
              width:       displayW,
              height:      displayH,
              background: '#0a0e1a',
              borderRadius: 8,
              border:      '1px solid rgba(255,255,255,0.08)',
              overflow:    'hidden',
              flexShrink:  0,
              // Subtle grid
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),' +
                'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: `${Math.round(120 * SCALE)}px ${Math.round(120 * SCALE)}px`,
            }}
            onClick={() => setSelectedId(null)}
          >
            {/* Canvas safe-area guides */}
            <div style={{
              position: 'absolute', inset: Math.round(54 * SCALE),
              border: '1px dashed rgba(255,255,255,0.06)',
              borderRadius: 4, pointerEvents: 'none',
            }} />

            {/* Render all elements */}
            {elements.map((el) => (
              <CanvasElement
                key={el.id}
                el={el}
                scale={SCALE}
                isSelected={el.id === selectedId}
                onSelect={() => setSelectedId(el.id)}
                onChange={(patch) => updateElement(el.id, patch)}
              />
            ))}

            {/* Empty state hint */}
            {elements.length === 0 && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.15)', fontSize: 13, fontWeight: 700,
                pointerEvents: 'none',
              }}>
                Pridajte prvý overlay prvok
              </div>
            )}

            {/* 1920×1080 label */}
            <div style={{
              position: 'absolute', bottom: 6, right: 8,
              color: 'rgba(255,255,255,0.18)', fontSize: 10, fontWeight: 700,
              pointerEvents: 'none',
            }}>
              1920 × 1080
            </div>
          </div>
        </div>

        {/* Right: Properties */}
        <div className="w-64 shrink-0 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-800 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {selectedElement
                ? `${ELEMENT_TYPES.find((t) => t.type === selectedElement.type)?.label ?? selectedElement.type}`
                : 'Vlastnosti'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <OverlayProperties
              element={selectedElement}
              onChange={(patch) => selectedId && updateElement(selectedId, patch)}
            />
          </div>
        </div>
      </div>

      {/* ── OBS tip ── */}
      <div className="flex items-start gap-2 px-4 py-3 bg-slate-900/60 border border-slate-800/60 rounded-xl">
        <span className="text-yellow-400 text-sm shrink-0 mt-0.5">💡</span>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Kliknite <strong className="text-slate-400">OBS HTML</strong> a pridajte exportovaný súbor do OBS ako Browser Source (1920×1080).
          Overlay sa aktualizuje v reálnom čase pri každom uložení.
        </p>
      </div>
    </div>
  )
}
