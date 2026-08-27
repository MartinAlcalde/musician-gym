import {
  REGISTER_OPTIONS,
  SCALE_TYPE_GROUPS,
  SCALE_TYPES,
  TONIC_NAMES_BY_SCALE
} from '../utils/constants.js'
import { displayNoteName, getScaleNoteNames } from '../utils/helpers.js'

export function TrainingSetup({
  tonicPc,
  scaleType,
  register,
  onTonicChange,
  onScaleTypeChange,
  onRegisterChange
}) {
  const scale = SCALE_TYPES[scaleType] || SCALE_TYPES.major
  const noteNames = getScaleNoteNames(tonicPc, scale.id).map(displayNoteName)

  return (
    <section className="training-setup" aria-labelledby="training-setup-heading">
      <div className="training-setup-heading">
        <div>
          <h2 id="training-setup-heading">Musical context</h2>
          <p>Choose the scale or mode first, then its tonal center and register.</p>
        </div>
        <span className="context-badge">{scale.cadenceLabel}</span>
      </div>

      <div className="training-range">
        <label className="scale-control">
          Scale or mode
          <select value={scale.id} onChange={event => onScaleTypeChange(event.target.value)}>
            {SCALE_TYPE_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.ids.map(id => (
                  <option key={id} value={id}>{SCALE_TYPES[id].label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          Tonal center
          <select value={tonicPc} onChange={event => onTonicChange(Number(event.target.value))}>
            {TONIC_NAMES_BY_SCALE[scale.id].map((tonicName, pitchClass) => (
              <option key={pitchClass} value={pitchClass}>{displayNoteName(tonicName)}</option>
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

      <p className="scale-summary">
        <strong>Notes:</strong> {noteNames.join(' · ')}
        <span>{scale.description}</span>
        <span>Major is Ionian; natural minor is Aeolian. The same notes can sound different when the tonal center changes.</span>
      </p>
    </section>
  )
}
