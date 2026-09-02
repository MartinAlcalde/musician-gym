export function BrandMark({ className = '' }) {
  return (
    <svg
      className={`brand-symbol ${className}`.trim()}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="brand-symbol-loop"
        d="M36.8 12.2A18 18 0 1 0 42 25v12H30"
      />
      <path
        className="brand-symbol-pulse"
        d="M8.5 31V17l7 9.5L23 17v14"
      />
      <circle className="brand-symbol-dot" cx="37.5" cy="13" r="2.6" />
    </svg>
  )
}
