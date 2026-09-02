import { useI18n } from '../i18n/I18nContext.jsx'

const TRAINING_AREAS = [
  { id: 'ear', number: '01' },
  { id: 'singing', number: '02' },
  { id: 'rhythm', number: '03', badge: 'R3' }
]

export function AppNavigation({ activeArea, isOpen, onSelectArea, onOpenSettings, onClose }) {
  const { locale, setLocale, t } = useI18n()

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`} id="app-navigation">
      <header className="sidebar-header">
        <button type="button" className="sidebar-brand" onClick={() => onSelectArea('ear')} aria-label="Musician Gym">
          <span className="sidebar-monogram" aria-hidden="true"><b>M</b><i>/</i><b>G</b></span>
          <span><strong>Musician Gym</strong><small>{t('app.disciplines')}</small></span>
        </button>
        <button type="button" className="sidebar-close" onClick={onClose} aria-label={t('nav.close')}>×</button>
      </header>

      <nav className="sidebar-nav" aria-label={t('nav.label')}>
        <p>{t('nav.practice')}</p>
        {TRAINING_AREAS.map(area => (
          <button
            type="button"
            key={area.id}
            className={activeArea === area.id ? 'active' : ''}
            aria-label={t(`nav.short.${area.id}`)}
            aria-current={activeArea === area.id ? 'page' : undefined}
            onClick={() => onSelectArea(area.id)}
          >
            <span className="sidebar-index">{area.number}</span>
            <span className="sidebar-nav-copy">
              <strong>{t(`nav.short.${area.id}`)}</strong>
              <small>{t(`nav.description.${area.id}`)}</small>
            </span>
            {area.badge && <b className="sidebar-badge">{area.badge}</b>}
            <span className="sidebar-arrow" aria-hidden="true">↗</span>
          </button>
        ))}

        <p className="sidebar-tools-label">{t('nav.toolsPlural')}</p>
        <button
          type="button"
          className={`sidebar-tool ${activeArea === 'tinnitus' ? 'active' : ''}`}
          aria-label={t('nav.tinnitus')}
          aria-current={activeArea === 'tinnitus' ? 'page' : undefined}
          onClick={() => onSelectArea('tinnitus')}
        >
          <span className="sidebar-index">T</span>
          <span className="sidebar-nav-copy">
            <strong>{t('nav.tinnitus')}</strong>
            <small>{t('nav.description.tinnitus')}</small>
          </span>
          <span className="sidebar-arrow" aria-hidden="true">↗</span>
        </button>
      </nav>

      <footer className="sidebar-footer">
        <div>
          <button
            type="button"
            onClick={() => setLocale(locale === 'es' ? 'en' : 'es')}
            aria-label={t('language.switchTo', {
              language: t(locale === 'es' ? 'language.english' : 'language.spanish')
            })}
          >
            <span>{locale === 'es' ? 'ES' : 'EN'}</span> {t('language.label')}
          </button>
          <button type="button" onClick={onOpenSettings} aria-label={t('settings.open')}>
            <span aria-hidden="true">⌘</span> {t('settings.button')}
          </button>
        </div>
        <p>{t('app.sidebarNote')}</p>
      </footer>
    </aside>
  )
}
