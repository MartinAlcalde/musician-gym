export function BrandMark({ className = '' }) {
  return (
    <svg
      className={`brand-symbol ${className}`.trim()}
      viewBox="0 0 72 48"
      aria-hidden="true"
      focusable="false"
    >
      <path className="brand-symbol-bar" d="M10 10h52" />
      <path className="brand-symbol-weights" d="M5 3v14M10 5v10M62 5v10M67 3v14" />
      <path className="brand-symbol-stems" d="M22 10v25M52 10v25" />
      <ellipse className="brand-symbol-note" cx="16" cy="37" rx="7" ry="4.8" transform="rotate(-18 16 37)" />
      <ellipse className="brand-symbol-note" cx="46" cy="37" rx="7" ry="4.8" transform="rotate(-18 46 37)" />
    </svg>
  )
}
