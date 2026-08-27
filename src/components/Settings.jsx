import { useEffect, useState } from 'react'
import { AUTO_INTERVALS } from '../utils/constants.js'
import { KeyMapping } from './KeyMapping.jsx'
import { RemoteControl } from './RemoteControl.jsx'

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: '◉' },
  { id: 'automatic', label: 'Auto practice', icon: '▶' },
  { id: 'controls', label: 'Controls', icon: '⌨' },
  { id: 'progress', label: 'Progress', icon: '↗' }
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
            <p className="eyebrow">Preferences</p>
            <h2 id="settings-heading">Settings</h2>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close settings">×</button>
        </header>

        <div className="settings-layout">
          <nav className="settings-nav" aria-label="Settings sections">
            {SETTINGS_SECTIONS.map(section => (
              <button
                type="button"
                key={section.id}
                className={activeSection === section.id ? 'active' : ''}
                aria-current={activeSection === section.id ? 'page' : undefined}
                onClick={() => setActiveSection(section.id)}
              >
                <span aria-hidden="true">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>

          <div className="settings-content">
            {activeSection === 'general' && (
              <SettingsSection title="General" description="Adjust how notes and feedback appear during practice.">
                <ToggleSetting
                  checked={resolve}
                  onChange={checked => onSettingChange('resolve', checked)}
                  title="Resolve to the tonic"
                  description="After a correct answer, hear the note return home to the tonal center."
                />
                <ToggleSetting
                  checked={settingsNotation === 'solfege'}
                  onChange={checked => onSettingChange('notation', checked ? 'solfege' : 'letter')}
                  title="Use solfege labels"
                  description="Show Do–Re–Mi. Turn off to use letter names such as C–D–E."
                />
                <ToggleSetting
                  checked={darkTheme}
                  onChange={checked => onSettingChange('darkTheme', checked)}
                  title="Dark theme"
                  description="Use a darker palette in low-light environments."
                />
              </SettingsSection>
            )}

            {activeSection === 'automatic' && (
              <SettingsSection title="Auto practice" description="Run hands-free listening rounds at a steady interval.">
                <ToggleSetting
                  checked={autoModeEnabled}
                  onChange={checked => onSettingChange('autoMode', checked)}
                  title="Enable Auto Mode"
                  description="The app plays a target, reveals or speaks its name, then starts the next round automatically."
                />

                <div className={`settings-subsection ${!autoModeEnabled ? 'disabled-section' : ''}`}>
                  <label className="setting-select">
                    <span>
                      <strong>Time between notes</strong>
                      <small>Leave enough time to recognize and sing or name the note.</small>
                    </span>
                    <select
                      value={autoInterval}
                      disabled={!autoModeEnabled}
                      onChange={event => onSettingChange('autoInterval', Number(event.target.value))}
                    >
                      {Object.entries(AUTO_INTERVALS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <ToggleSetting
                    disabled={!autoModeEnabled}
                    checked={showAnswer}
                    onChange={checked => onSettingChange('showAnswer', checked)}
                    title="Highlight the answer"
                    description="Show the correct piano key before moving on."
                  />
                  <ToggleSetting
                    disabled={!autoModeEnabled}
                    checked={sayAnswer}
                    onChange={checked => onSettingChange('sayAnswer', checked)}
                    title="Speak the answer"
                    description="Read the note name aloud when speech synthesis is available."
                  />
                </div>

                <WakeLockStatus screenWakeLock={screenWakeLock} />
              </SettingsSection>
            )}

            {activeSection === 'controls' && (
              <SettingsSection title="Controls" description="Answer with a keyboard, gamepad, pedal, or compatible Bluetooth controller.">
                <div className="controls-guide">
                  <strong>Why add controls?</strong>
                  <p>They let you answer without looking at or touching the screen—useful while holding an instrument.</p>
                  <ol>
                    <li>Select <strong>Set key</strong> beside a scale degree.</li>
                    <li>Press the keyboard key or external button you want to use.</li>
                    <li>Use device detection below to check a gamepad or Bluetooth controller.</li>
                  </ol>
                  <p className="muted">Mappings follow scale degrees, so the same buttons work in every key and mode.</p>
                </div>

                <h4 className="settings-subheading">Note mappings</h4>
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
                  <summary>Connect or test an external controller</summary>
                  <RemoteControl onKeyTest={onKeyTest} />
                </details>
              </SettingsSection>
            )}

            {activeSection === 'progress' && (
              <SettingsSection title="Progress" description="Your attempts and accuracy are saved only in this browser.">
                <div className="danger-zone">
                  <div>
                    <strong>Reset saved progress</strong>
                    <p>Clear attempt and accuracy totals. Your preferences and control mappings stay unchanged.</p>
                  </div>
                  <button type="button" className="danger-button" onClick={onResetProgress}>Reset progress</button>
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
  let message = 'The screen will stay awake after Auto Mode starts.'
  let tone = 'info'

  if (screenWakeLock.error || !screenWakeLock.isSupported) {
    message = 'This browser cannot keep the screen awake. Android may suspend audio; disable battery saving or keep the screen on.'
    tone = 'warning'
  } else if (screenWakeLock.isActive) {
    message = 'Screen protection is active while Auto Mode runs.'
    tone = 'success'
  }

  return <p className={`wake-lock-status ${tone}`}>{message}</p>
}
