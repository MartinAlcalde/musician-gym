export function GameControls({
  onStart,
  onRepeat,
  onToggleExerciseSelector,
  startEnabled,
  repeatEnabled,
  autoMode,
  isAutoRunning,
  currentExercise,
  contextLabel
}) {
  const getStartButtonText = () => {
    if (autoMode && isAutoRunning) return '⏹️ Stop Auto Mode'
    if (autoMode) return 'Start Auto Mode'
    return 'Start / Next'
  }

  return (
      <div className="row game-actions">
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
          🎵 Ex {currentExercise} · {contextLabel}
        </button>

      </div>
  )
}
