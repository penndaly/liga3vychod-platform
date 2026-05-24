/**
 * OverlayScoreElement.jsx
 *
 * A draggable score-bar overlay element rendered inside the canvas div.
 * Coordinates are stored in 1920×1080 space; the canvas passes a `scale`
 * factor (0.5 for 960×540 display) so elements render at the right size.
 *
 * Drag is handled with mousedown/mousemove/mouseup — no external deps.
 */

// ── Badge image (tiny inline SVG circle as fallback) ──────────────────────
function TeamBadge({ url, alt, size }) {
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4 }}
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 6,
      background: 'rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, color: 'rgba(255,255,255,0.4)', fontWeight: 900,
    }}>
      {alt?.[0] ?? '?'}
    </div>
  )
}

// ── Score element ─────────────────────────────────────────────────────────
export default function OverlayScoreElement({ element: el, scale, isSelected, onSelect, onChange }) {
  const x = Math.round(el.x * scale)
  const y = Math.round(el.y * scale)
  const w = Math.round(el.width  * scale)
  const h = Math.round(el.height * scale)

  const badgeSize  = Math.round(h * 0.65)
  const nameFontSz = Math.round(h * 0.22)
  const scoreFontSz= Math.round(h * 0.36)
  const timeFontSz = Math.round(h * 0.16)
  const pad        = Math.round(h * 0.12)

  function handleMouseDown(e) {
    e.stopPropagation()
    onSelect()
    const startClientX = e.clientX
    const startClientY = e.clientY
    const origX = el.x
    const origY = el.y

    function onMove(me) {
      onChange({
        x: Math.max(0, Math.min(1920 - el.width,  Math.round(origX + (me.clientX - startClientX) / scale))),
        y: Math.max(0, Math.min(1080 - el.height, Math.round(origY + (me.clientY - startClientY) / scale))),
      })
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position:     'absolute',
        left:          x,
        top:           y,
        width:         w,
        height:        h,
        background:    el.backgroundColor ?? 'rgba(15,23,42,0.92)',
        borderRadius:  Math.round(8 * scale),
        border:        isSelected ? '2px solid #16a34a' : '2px solid transparent',
        boxShadow:     '0 4px 24px rgba(0,0,0,.6)',
        cursor:       'move',
        userSelect:   'none',
        display:      'flex',
        alignItems:   'center',
        overflow:     'hidden',
        padding:      `0 ${pad}px`,
        gap:           Math.round(h * 0.1),
        boxSizing:    'border-box',
      }}
    >
      {/* Home side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: pad * 0.6, flex: 1, minWidth: 0 }}>
        <TeamBadge url={el.homeBadgeUrl} alt={el.homeTeam} size={badgeSize} />
        <span style={{
          color:      el.textColor ?? '#ffffff',
          fontSize:   nameFontSz,
          fontWeight: 900,
          whiteSpace: 'nowrap',
          overflow:   'hidden',
          textOverflow: 'ellipsis',
        }}>
          {el.homeTeam ?? 'Domáci'}
        </span>
      </div>

      {/* Score + time column */}
      <div style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        flexShrink:     0,
        gap:            2,
      }}>
        <span style={{
          color:      el.textColor ?? '#ffffff',
          fontSize:   scoreFontSz,
          fontWeight: 900,
          letterSpacing: '0.05em',
          lineHeight:  1,
        }}>
          {el.homeScore ?? 0} — {el.awayScore ?? 0}
        </span>
        <span style={{
          color:      '#facc15',
          fontSize:   timeFontSz,
          fontWeight: 700,
          lineHeight:  1,
        }}>
          {el.time ?? "0'"}
        </span>
      </div>

      {/* Away side */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: pad * 0.6,
        flex: 1, minWidth: 0, flexDirection: 'row-reverse',
      }}>
        <TeamBadge url={el.awayBadgeUrl} alt={el.awayTeam} size={badgeSize} />
        <span style={{
          color:      el.textColor ?? '#ffffff',
          fontSize:   nameFontSz,
          fontWeight: 900,
          whiteSpace: 'nowrap',
          overflow:   'hidden',
          textOverflow: 'ellipsis',
          textAlign: 'right',
        }}>
          {el.awayTeam ?? 'Hostia'}
        </span>
      </div>
    </div>
  )
}
