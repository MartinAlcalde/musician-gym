export function GameDisplay({ feedback, feedbackOk, attempts, correct, accuracy }) {
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
        aria-label={`${attempts} attempts, ${correct} correct, ${accuracy} percent accuracy`}
      >
        Attempts: {attempts} | Correct: {correct} | Accuracy: {accuracy}%
      </div>
    </>
  )
}
