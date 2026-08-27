import { useI18n } from '../i18n/I18nContext.jsx'

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
  const { t } = useI18n()
  const getStartButtonText = () => {
    if (autoMode && isAutoRunning) return t('game.stopAuto')
    if (autoMode) return t('game.startAuto')
    return t('game.startNext')
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
          {t('game.repeat')}
        </button>

        <button
          onClick={onToggleExerciseSelector}
          title={t('game.selectExercise')}
        >
          🎵 {t('game.exerciseShort', { number: currentExercise })} · {contextLabel}
        </button>

      </div>
  )
}
