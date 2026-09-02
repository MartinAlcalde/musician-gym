import { useI18n } from '../i18n/I18nContext.jsx'

const AreaIcon = ({ area }) => {
  if (area === 'ear') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12a8 8 0 0 1 16 0c0 4-2 5-4 6.5-1.3 1-1.8 1.5-2 2.5" />
        <path d="M9 12a3 3 0 0 1 6 0c0 2-2.5 2-2.5 4" />
        <path d="M10 21h4" />
      </svg>
    )
  }
  if (area === 'singing') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="8" y="3" width="8" height="12" rx="4" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6" />
      </svg>
    )
  }
  if (area === 'rhythm') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18V5l10-2v13" />
        <ellipse cx="6" cy="18" rx="3" ry="2" />
        <ellipse cx="16" cy="16" rx="3" ry="2" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12h3l2-6 4 12 3-9 2 3h4" />
    </svg>
  )
}

const PRACTICE_AREAS = ['ear', 'singing', 'rhythm']

export function HomeDashboard({
  onSelectArea,
  tonalityLabel,
  notationLabel,
  instrumentLabel,
  onOpenSettings
}) {
  const { t } = useI18n()

  return (
    <section className="home-dashboard" aria-labelledby="home-heading">
      <header className="home-hero">
        <div>
          <p className="eyebrow">{t('home.eyebrow')}</p>
          <h2 id="home-heading">{t('home.title')}</h2>
          <p>{t('home.intro')}</p>
        </div>
        <div className="home-rhythm-mark" aria-hidden="true">
          <span>R</span><strong>3</strong>
        </div>
      </header>

      <div className="home-section-heading">
        <div>
          <p className="eyebrow">{t('home.practiceEyebrow')}</p>
          <h3>{t('home.practiceTitle')}</h3>
        </div>
        <span>{t('home.practiceCount')}</span>
      </div>

      <div className="home-practice-grid">
        {PRACTICE_AREAS.map((area, index) => (
          <button
            key={area}
            type="button"
            className={`home-practice-card area-${area}`}
            onClick={() => onSelectArea(area)}
          >
            <span className="home-card-number">0{index + 1}</span>
            <span className="home-card-icon"><AreaIcon area={area} /></span>
            <span className="home-card-copy">
              <strong>{t(`home.${area}.title`)}</strong>
              <span>{t(`home.${area}.description`)}</span>
            </span>
            <span className="home-card-footer">
              <small>{t(`home.${area}.meta`)}</small>
              <b aria-hidden="true">→</b>
            </span>
          </button>
        ))}
      </div>

      <div className="home-lower-grid">
        <section className="home-context-card" aria-labelledby="home-context-heading">
          <div>
            <p className="eyebrow">{t('home.contextEyebrow')}</p>
            <h3 id="home-context-heading">{t('home.contextTitle')}</h3>
          </div>
          <dl>
            <div><dt>{t('home.contextTonality')}</dt><dd>{tonalityLabel}</dd></div>
            <div><dt>{t('home.contextNotation')}</dt><dd>{notationLabel}</dd></div>
            <div><dt>{t('home.contextSound')}</dt><dd>{instrumentLabel}</dd></div>
          </dl>
          <button type="button" className="text-button" onClick={onOpenSettings}>
            {t('home.contextAction')} <span aria-hidden="true">→</span>
          </button>
        </section>

        <button
          type="button"
          className="home-tool-card"
          onClick={() => onSelectArea('tinnitus')}
        >
          <span className="home-card-icon"><AreaIcon area="tinnitus" /></span>
          <span className="home-card-copy">
            <small>{t('home.toolEyebrow')}</small>
            <strong>{t('home.tinnitus.title')}</strong>
            <span>{t('home.tinnitus.description')}</span>
          </span>
          <b aria-hidden="true">→</b>
        </button>
      </div>
    </section>
  )
}
