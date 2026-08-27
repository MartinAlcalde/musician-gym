import { AUTO_INTERVALS } from '../utils/constants.js'
import { KeyMapping } from './KeyMapping.jsx'
import { RemoteControl } from './RemoteControl.jsx'

export function Settings({
  isVisible,
  settings,
  onSettingChange,
  // Key mapping props
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
    <div className="panel" aria-label="Settings">
      <div className="row" style={{marginTop: 0, alignItems: 'center', gap: '14px'}}>
        <label>
          <input 
            type="checkbox" 
            checked={resolve} 
            onChange={(e) => onSettingChange('resolve', e.target.checked)} 
          /> 
          Resolve to tonic
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={settingsNotation === 'solfege'} 
            onChange={(e) => onSettingChange('notation', e.target.checked ? 'solfege' : 'letter')} 
          /> 
          Solfege labels (Do Re)
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={darkTheme} 
            onChange={(e) => onSettingChange('darkTheme', e.target.checked)} 
          /> 
          Dark theme
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={autoModeEnabled} 
            onChange={(e) => onSettingChange('autoMode', e.target.checked)} 
          /> 
          Auto mode (passive practice)
        </label>
        
      </div>
      
      {autoModeEnabled && (
        <AutoModeSettings
          autoInterval={autoInterval}
          showAnswer={showAnswer}
          sayAnswer={sayAnswer}
          screenWakeLock={screenWakeLock}
          onSettingChange={onSettingChange}
        />
      )}

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

      <button type="button" className="reset-progress-button" onClick={onResetProgress}>
        Reset saved progress
      </button>

      <RemoteControl
        onKeyTest={onKeyTest}
      />
    </div>
  )
}

function AutoModeSettings({ autoInterval, showAnswer, sayAnswer, screenWakeLock, onSettingChange }) {
  return (
    <div className="panel" style={{marginTop: '8px', padding: '8px'}}>
      <div style={{fontWeight: 600, marginBottom: '6px'}}>Auto Mode Settings</div>
      <div className="row" style={{margin: 0, gap: '14px', alignItems: 'center'}}>
        <label>
          Interval:
          <select 
            value={autoInterval} 
            onChange={(e) => onSettingChange('autoInterval', Number(e.target.value))}
          >
            {Object.entries(AUTO_INTERVALS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={showAnswer} 
            onChange={(e) => onSettingChange('showAnswer', e.target.checked)} 
          /> 
          Show answer
        </label>
        
        <label>
          <input 
            type="checkbox" 
            checked={sayAnswer} 
            onChange={(e) => onSettingChange('sayAnswer', e.target.checked)} 
          /> 
          Say answer (if available)
        </label>
      </div>
      <div className="muted" style={{marginTop: '8px', fontSize: '12px'}}>
        {screenWakeLock.error
          ? '⚠️ Android may suspend audio. Disable battery saving or keep the screen on.'
          : screenWakeLock.isSupported
          ? screenWakeLock.isActive
            ? '🔆 Screen will stay awake while Auto Mode is running.'
            : 'The screen will stay awake after Auto Mode starts.'
          : '⚠️ Keep the screen on: this browser cannot prevent Android from suspending audio.'}
      </div>
    </div>
  )
}
