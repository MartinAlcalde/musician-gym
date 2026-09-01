import { useEffect, useState } from 'react'
import { AUTO_INTERVALS } from '../utils/constants.js'
import { KeyMapping } from './KeyMapping.jsx'
import { RemoteControl } from './RemoteControl.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

const SETTINGS_SECTIONS = [
  { id: 'general', icon: '◉' },
  { id: 'automatic', icon: '▶' },
  { id: 'controls', icon: '⌨' },
  { id: 'progress', icon: '↗' }
]

export function Settings({
  isVisible,
  onClose,
  settings,
  onSettingChange,
  exerciseSet,
  tonicMidi,
  scaleType,
  notation,
  getKeyForMidi,
  startMapping,
  clearKeymap,
  waitingMapMidi,
  onKeyTest,
  screenWakeLock,
  onResetProgress
}) {
  const { locale, setLocale, t } = useI18n()
  const [activeSection, setActiveSection] = useState('general')

  useEffect(() => {
    if (!isVisible) return undefined
    const closeOnEscape = event => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isVisible, onClose])

  if (!isVisible) return null

  const {
    resolve,
    notation: settingsNotation,
    darkTheme,
    autoMode: autoModeEnabled,
    autoInterval,
    showAnswer,
    sayAnswer
  } = settings

  return (
    <div
      className="settings-overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-heading">
        <header className="settings-header">
          <div>
            <p className="eyebrow">{t('settings.preferences')}</p>
            <h2 id="settings-heading">{t('settings.title')}</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label={t('settings.close')}>×</button>
        </header>

        <div className="settings-layout">
          <nav className="settings-nav" aria-label={t('settings.sections')}>
            {SETTINGS_SECTIONS.map(section => (
              <button
                type="button"
                key={section.id}
                className={activeSection === section.id ? 'active' : ''}
                aria-current={activeSection === section.id ? 'page' : undefined}
                onClick={() => setActiveSection(section.id)}
              >
                <span aria-hidden="true">{section.icon}</span>
                {t(`settings.section.${section.id}`)}
              </button>
            ))}
          </nav>

          <div className="settings-content">
            {activeSection === 'general' && (
              <SettingsSection title={t('settings.section.general')} description={t('settings.general.description')}>
                <label className="setting-select">
                  <span>
                    <strong>{t('settings.language.title')}</strong>
                    <small>{t('settings.language.description')}</small>
                  </span>
                  <select value={locale} onChange={event => setLocale(event.target.value)}>
                    <option value="en">{t('language.english')}</option>
                    <option value="es">{t('language.spanish')}</option>
                  </select>
                </label>
                <ToggleSetting
                  checked={resolve}
                  onChange={checked => onSettingChange('resolve', checked)}
                  title={t('settings.resolve.title')}
                  description={t('settings.resolve.description')}
                />
                <label className="setting-select">
                  <span>
                    <strong>{t('settings.notation.title')}</strong>
                    <small>{t('settings.notation.description')}</small>
                  </span>
                  <select
                    value={settingsNotation}
                    onChange={event => onSettingChange('notation', event.target.value)}
                  >
                    <option value="solfege">{t('settings.notation.solfege')}</option>
                    <option value="letter">{t('settings.notation.letter')}</option>
                    <option value="degree">{t('settings.notation.degree')}</option>
                  </select>
                </label>
                <label className="setting-select">
                  <span>
                    <strong>{t('settings.instrument.title')}</strong>
                    <small>{t('settings.instrument.description')}</small>
                  </span>
                  <select
                    value={settings.instrument}
                    onChange={event => onSettingChange('instrument', event.target.value)}
                  >
                    <option value="piano">{t('settings.instrument.piano')}</option>
                    <option value="guitar">{t('settings.instrument.guitar')}</option>
                  </select>
                </label>
                <ToggleSetting
                  checked={darkTheme}
                  onChange={checked => onSettingChange('darkTheme', checked)}
                  title={t('settings.theme.title')}
                  description={t('settings.theme.description')}
                />
              </SettingsSection>
            )}

            {activeSection === 'automatic' && (
              <SettingsSection title={t('settings.section.automatic')} description={t('settings.automatic.description')}>
                <ToggleSetting
                  checked={autoModeEnabled}
                  onChange={checked => onSettingChange('autoMode', checked)}
                  title={t('settings.autoMode.title')}
                  description={t('settings.autoMode.description')}
                />

                <div className={`settings-subsection ${!autoModeEnabled ? 'disabled-section' : ''}`}>
                  <label className="setting-select">
                    <span>
                      <strong>{t('settings.interval.title')}</strong>
                      <small>{t('settings.interval.description')}</small>
                    </span>
                    <select
                      value={autoInterval}
                      disabled={!autoModeEnabled}
                      onChange={event => onSettingChange('autoInterval', Number(event.target.value))}
                    >
                      {Object.keys(AUTO_INTERVALS).map(value => (
                        <option key={value} value={value}>{t('settings.interval.seconds', { count: Number(value) / 1000 })}</option>
                      ))}
                    </select>
                  </label>
                  <ToggleSetting
                    disabled={!autoModeEnabled}
                    checked={showAnswer}
                    onChange={checked => onSettingChange('showAnswer', checked)}
                    title={t('settings.highlight.title')}
                    description={t('settings.highlight.description')}
                  />
                  <ToggleSetting
                    disabled={!autoModeEnabled}
                    checked={sayAnswer}
                    onChange={checked => onSettingChange('sayAnswer', checked)}
                    title={t('settings.speak.title')}
                    description={t('settings.speak.description')}
                  />
                </div>

                <WakeLockStatus screenWakeLock={screenWakeLock} />
              </SettingsSection>
            )}

            {activeSection === 'controls' && (
              <SettingsSection title={t('settings.section.controls')} description={t('settings.controls.description')}>
                <div className="controls-guide">
                  <strong>{t('settings.controls.why')}</strong>
                  <p>{t('settings.controls.whyText')}</p>
                  <ol>
                    <li>{t('settings.controls.step1.before')} <strong>{t('settings.controls.setKey')}</strong> {t('settings.controls.step1.after')}</li>
                    <li>{t('settings.controls.step2')}</li>
                    <li>{t('settings.controls.step3')}</li>
                  </ol>
                  <p className="muted">{t('settings.controls.mappingHelp')}</p>
                </div>

                <h4 className="settings-subheading">{t('settings.controls.noteMappings')}</h4>
                <KeyMapping
                  exerciseSet={exerciseSet}
                  tonicMidi={tonicMidi}
                  scaleType={scaleType}
                  notation={notation}
                  getKeyForMidi={getKeyForMidi}
                  startMapping={startMapping}
                  clearKeymap={clearKeymap}
                  waitingMapMidi={waitingMapMidi}
                />

                <details className="device-details">
                  <summary>{t('settings.controls.external')}</summary>
                  <RemoteControl onKeyTest={onKeyTest} />
                </details>
              </SettingsSection>
            )}

            {activeSection === 'progress' && (
              <SettingsSection title={t('settings.section.progress')} description={t('settings.progress.description')}>
                <div className="danger-zone">
                  <div>
                    <strong>{t('settings.progress.resetTitle')}</strong>
                    <p>{t('settings.progress.resetDescription')}</p>
                  </div>
                  <button type="button" className="danger-button" onClick={onResetProgress}>{t('settings.progress.resetButton')}</button>
                </div>
              </SettingsSection>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function SettingsSection({ title, description, children }) {
  return (
    <section className="settings-section">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      {children}
    </section>
  )
}

function ToggleSetting({ checked, onChange, title, description, disabled = false }) {
  return (
    <label className={`setting-toggle ${disabled ? 'disabled' : ''}`}>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={event => onChange(event.target.checked)}
      />
    </label>
  )
}

function WakeLockStatus({ screenWakeLock }) {
  const { t } = useI18n()
  let message = t('settings.wake.ready')
  let tone = 'info'

  if (screenWakeLock.error || !screenWakeLock.isSupported) {
    message = t('settings.wake.warning')
    tone = 'warning'
  } else if (screenWakeLock.isActive) {
    message = t('settings.wake.active')
    tone = 'success'
  }

  return <p className={`wake-lock-status ${tone}`}>{message}</p>
}
