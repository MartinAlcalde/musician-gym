import { REGISTER_OPTIONS, SCALE_TYPES, TONALITIES } from '../utils/constants.js'

export function GameControls({
  onStart,
  onRepeat,
  onToggleSettings,
  onToggleExerciseSelector,
  startEnabled,
  repeatEnabled,
  autoMode,
  isAutoRunning,
  currentExercise,
  tonicPc,
  scaleType,
  register,
  onTonicChange,
  onRegisterChange
}) {
  const getStartButtonText = () => {
    if (autoMode && isAutoRunning) return '⏹️ Stop Auto Mode'
    if (autoMode) return 'Start Auto Mode'
    return 'Start / Next'
  }

  const tonality = TONALITIES.find(option => (
    option.value === tonicPc && option.scaleType === scaleType
  )) || TONALITIES[0]

  return (
    <>
      <div className="row">
        <button
          id="start"
          onClick={onStart}
          disabled={!startEnabled}
        >
          {getStartButtonText()}
        </button>

        <button
          onClick={onRepeat}
          disabled={!repeatEnabled}
        >
          Repeat
        </button>

        <button
          onClick={onToggleExerciseSelector}
          title="Select Exercise"
        >
          🎵 Ex {currentExercise} · {tonality.shortLabel}
        </button>

        <button
          onClick={onToggleSettings}
          title="Settings"
          aria-label="Settings"
        >
          ⚙️
        </button>
      </div>

      <div className="training-range" aria-label="Training tonality and register">
        <label>
          Tonality
          <select
            value={`${scaleType}:${tonicPc}`}
            onChange={event => {
              const [nextScaleType, nextTonicPc] = event.target.value.split(':')
              onTonicChange(Number(nextTonicPc), nextScaleType)
            }}
          >
            {Object.values(SCALE_TYPES).map(scale => (
              <optgroup key={scale.id} label={scale.label}>
                {TONALITIES.filter(option => option.scaleType === scale.id).map(option => (
                  <option key={option.id} value={option.id}>{option.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          Register
          <select value={register} onChange={event => onRegisterChange(event.target.value)}>
            {REGISTER_OPTIONS.map(option => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>
    </>
  )
}
