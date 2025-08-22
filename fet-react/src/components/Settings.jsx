import { AUTO_INTERVALS } from '../utils/constants.js'
import { KeyMapping } from './KeyMapping.jsx'
import { RemoteControl } from './RemoteControl.jsx'

export function Settings({
  isVisible,
  settings,
  onSettingChange,
  autoMode,
  // Key mapping props
  exerciseSet,
  notation,
  getKeyForMidi,
  startMapping,
  clearKeymap,
  waitingMapMidi,
  onKeyTest
}) {
  if (!isVisible) return null

  const {
    resolve,
    notation: settingsNotation,
    darkTheme,
    autoMode: autoModeEnabled,
    exercise,
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
          Resolve to C
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
        
        <label>
          Exercise:
          <select 
            value={exercise} 
            onChange={(e) => onSettingChange('exercise', Number(e.target.value))}
          >
            <option value="1">Ex 1 – C to F</option>
            <option value="2">Ex 2 – G to C (next)</option>
            <option value="3">Ex 3 – Full octave (C–C)</option>
          </select>
        </label>
      </div>
      
      {autoModeEnabled && (
        <AutoModeSettings
          autoInterval={autoInterval}
          showAnswer={showAnswer}
          sayAnswer={sayAnswer}
          onSettingChange={onSettingChange}
        />
      )}

      <KeyMapping
        exerciseSet={exerciseSet}
        notation={notation}
        getKeyForMidi={getKeyForMidi}
        startMapping={startMapping}
        clearKeymap={clearKeymap}
        waitingMapMidi={waitingMapMidi}
      />

      <RemoteControl
        onKeyTest={onKeyTest}
      />
    </div>
  )
}

function AutoModeSettings({ autoInterval, showAnswer, sayAnswer, onSettingChange }) {
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
    </div>
  )
}