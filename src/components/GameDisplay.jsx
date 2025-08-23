export function GameDisplay({ feedback, feedbackOk, attempts, correct, accuracy }) {
  return (
    <>
      <div className={`feedback ${feedbackOk === true ? 'ok' : feedbackOk === false ? 'err' : ''}`}>
        {feedback}
      </div>
      
      <div className="stat">
        Attempts: {attempts} | Correct: {correct} | Accuracy: {accuracy}%
      </div>
    </>
  )
}