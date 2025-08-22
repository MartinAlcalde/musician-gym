export function GameControls({
  onStart,
  onRepeat,
  onToggleSettings,
  startEnabled,
  repeatEnabled,
  autoMode,
  isAutoRunning
}) {
  const getStartButtonText = () => {
    if (autoMode && isAutoRunning) return '⏹️ Stop Auto Mode'
    if (autoMode) return 'Start Auto Mode'
    return 'Start / Next'
  }

  return (
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
        onClick={onToggleSettings} 
        title="Settings"
      >
        ⚙️
      </button>
    </div>
  )
}