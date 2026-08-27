import { useI18n } from '../i18n/I18nContext.jsx'

export function GameDisplay({ feedback, feedbackOk, attempts, correct, accuracy }) {
  const { t } = useI18n()
  return (
    <>
      <div
        className={`feedback ${feedbackOk === true ? 'ok' : feedbackOk === false ? 'err' : ''}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback}
      </div>
      
      <div
        className="stat"
        aria-label={t('stats.aria', { attempts, correct, accuracy })}
      >
        {t('stats.visible', { attempts, correct, accuracy })}
      </div>
    </>
  )
}
