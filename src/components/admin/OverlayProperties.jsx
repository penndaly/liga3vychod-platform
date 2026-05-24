/**
 * OverlayProperties.jsx
 * Right-side properties panel for the selected overlay element.
 * Shows different fields based on element.type.
 */

const L = 'block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'
const I = 'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-yellow-400/50 transition-colors'

function Field({ label, children }) {
  return (
    <div>
      <label className={L}>{label}</label>
      {children}
    </div>
  )
}

function NumberInput({ value, onChange, min = 0, max, step = 1 }) {
  return (
    <input
      type="number"
      value={value ?? 0}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className={I}
    />
  )
}

function TextInput({ value, onChange, placeholder = '' }) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={I}
    />
  )
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value?.replace(/rgba?\([^)]+\)/, '#0f172a') ?? '#0f172a'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
      />
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#ffffff or rgba(...)"
        className={`${I} flex-1`}
      />
    </div>
  )
}

function Row({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

// ── Score element properties ───────────────────────────────────────────────
function ScoreProps({ el, onChange }) {
  return (
    <>
      <Field label="Domáci tím">
        <TextInput value={el.homeTeam} onChange={(v) => onChange({ homeTeam: v })} />
      </Field>
      <Field label="Hostia">
        <TextInput value={el.awayTeam} onChange={(v) => onChange({ awayTeam: v })} />
      </Field>
      <Row>
        <Field label="Skóre dom.">
          <NumberInput value={el.homeScore} min={0} max={99} onChange={(v) => onChange({ homeScore: v })} />
        </Field>
        <Field label="Skóre host.">
          <NumberInput value={el.awayScore} min={0} max={99} onChange={(v) => onChange({ awayScore: v })} />
        </Field>
      </Row>
      <Field label="Čas zápasu">
        <TextInput value={el.time} onChange={(v) => onChange({ time: v })} placeholder="45:00" />
      </Field>
      <Field label="Farba pozadia">
        <ColorInput value={el.backgroundColor} onChange={(v) => onChange({ backgroundColor: v })} />
      </Field>
      <Field label="Farba textu">
        <ColorInput value={el.textColor} onChange={(v) => onChange({ textColor: v })} />
      </Field>
      <Row>
        <Field label="URL erbu dom.">
          <TextInput value={el.homeBadgeUrl} onChange={(v) => onChange({ homeBadgeUrl: v })} placeholder="https://…" />
        </Field>
        <Field label="URL erbu host.">
          <TextInput value={el.awayBadgeUrl} onChange={(v) => onChange({ awayBadgeUrl: v })} placeholder="https://…" />
        </Field>
      </Row>
    </>
  )
}

// ── Lower third properties ─────────────────────────────────────────────────
function LowerThirdProps({ el, onChange }) {
  return (
    <>
      <Field label="Hlavný text">
        <TextInput value={el.title} onChange={(v) => onChange({ title: v })} placeholder="Ján Novák" />
      </Field>
      <Field label="Podtitul">
        <TextInput value={el.subtitle} onChange={(v) => onChange({ subtitle: v })} placeholder="Strelec · 12'" />
      </Field>
      <Field label="Farba akcentu">
        <ColorInput value={el.accentColor} onChange={(v) => onChange({ accentColor: v })} />
      </Field>
    </>
  )
}

// ── Text properties ────────────────────────────────────────────────────────
function TextProps({ el, onChange }) {
  return (
    <>
      <Field label="Text">
        <textarea
          value={el.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
          className={`${I} resize-none`}
        />
      </Field>
      <Row>
        <Field label="Veľkosť písma">
          <NumberInput value={el.fontSize} min={8} max={200} onChange={(v) => onChange({ fontSize: v })} />
        </Field>
        <Field label="Farba textu">
          <ColorInput value={el.textColor} onChange={(v) => onChange({ textColor: v })} />
        </Field>
      </Row>
      <Field label="Hrúbka písma">
        <select
          value={el.fontWeight ?? 'normal'}
          onChange={(e) => onChange({ fontWeight: e.target.value })}
          className={I}
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="900">Black</option>
        </select>
      </Field>
    </>
  )
}

// ── Fixture banner properties ──────────────────────────────────────────────
function FixtureProps({ el, onChange }) {
  return (
    <>
      <Field label="Domáci tím">
        <TextInput value={el.homeTeam} onChange={(v) => onChange({ homeTeam: v })} />
      </Field>
      <Field label="Hostia">
        <TextInput value={el.awayTeam} onChange={(v) => onChange({ awayTeam: v })} />
      </Field>
      <Field label="Dátum a čas">
        <TextInput value={el.datetime} onChange={(v) => onChange({ datetime: v })} placeholder="So 21. 6. · 17:00" />
      </Field>
      <Field label="Súťaž">
        <TextInput value={el.competition} onChange={(v) => onChange({ competition: v })} placeholder="Liga 3 Východ" />
      </Field>
    </>
  )
}

// ── Sponsor properties ────────────────────────────────────────────────────
function SponsorProps({ el, onChange }) {
  return (
    <>
      <Field label="URL loga (obrázok)">
        <TextInput value={el.logoUrl} onChange={(v) => onChange({ logoUrl: v })} placeholder="https://…" />
      </Field>
      <Field label="Názov sponzora">
        <TextInput value={el.name} onChange={(v) => onChange({ name: v })} placeholder="Generálny sponzor" />
      </Field>
      <Row>
        <Field label="Šírka">
          <NumberInput value={el.width} min={50} max={1920} onChange={(v) => onChange({ width: v })} />
        </Field>
        <Field label="Výška">
          <NumberInput value={el.height} min={50} max={1080} onChange={(v) => onChange({ height: v })} />
        </Field>
      </Row>
      <Field label="Priehľadnosť (0–1)">
        <NumberInput value={el.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => onChange({ opacity: v })} />
      </Field>
    </>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export default function OverlayProperties({ element, onChange }) {
  if (!element) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-700">
        <p className="text-xs font-bold">Vyberte prvok na plátne</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Type-specific fields */}
      {element.type === 'score'       && <ScoreProps      el={element} onChange={onChange} />}
      {element.type === 'lower_third' && <LowerThirdProps el={element} onChange={onChange} />}
      {element.type === 'text'        && <TextProps        el={element} onChange={onChange} />}
      {element.type === 'fixture'     && <FixtureProps     el={element} onChange={onChange} />}
      {element.type === 'sponsor'     && <SponsorProps     el={element} onChange={onChange} />}

      {/* Divider */}
      <div className="border-t border-slate-800 pt-4">
        <p className={L}>Poloha & rozmer</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="X">
            <NumberInput value={element.x} min={0} max={1920} onChange={(v) => onChange({ x: v })} />
          </Field>
          <Field label="Y">
            <NumberInput value={element.y} min={0} max={1080} onChange={(v) => onChange({ y: v })} />
          </Field>
          <Field label="Šírka">
            <NumberInput value={element.width} min={20} max={1920} onChange={(v) => onChange({ width: v })} />
          </Field>
          <Field label="Výška">
            <NumberInput value={element.height} min={20} max={1080} onChange={(v) => onChange({ height: v })} />
          </Field>
        </div>
      </div>
    </div>
  )
}
