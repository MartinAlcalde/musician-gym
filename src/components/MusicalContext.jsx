import { useId } from 'react'
import {
  REGISTER_OPTIONS,
  SCALE_TYPE_GROUPS,
  SCALE_TYPES,
  TONIC_NAMES_BY_SCALE
} from '../utils/constants.js'
import { displayNoteName, getScaleNoteNames } from '../utils/helpers.js'
import { useI18n } from '../i18n/I18nContext.jsx'

export function MusicalContext({
  tonicPc,
  scaleType,
  register,
  showRegister = true,
  onTonicChange,
  onScaleTypeChange,
  onRegisterChange
}) {
  const { t } = useI18n()
  const headingId = useId()
  const scale = SCALE_TYPES[scaleType] || SCALE_TYPES.major
  const noteNames = getScaleNoteNames(tonicPc, scale.id).map(displayNoteName)

  return (
    <section className="musical-context" aria-labelledby={headingId}>
      <div className="musical-context-heading">
        <div>
          <h2 id={headingId}>{t('training.title')}</h2>
          <p>{t(showRegister ? 'training.help' : 'training.helpSinging')}</p>
        </div>
        <span className="context-badge">{scale.cadenceLabel}</span>
      </div>

      <div className={`training-range ${showRegister ? '' : 'no-register'}`}>
        <label className="scale-control">
          {t('training.scaleMode')}
          <select value={scale.id} onChange={event => onScaleTypeChange(event.target.value)}>
            {SCALE_TYPE_GROUPS.map(group => (
              <optgroup key={group.label} label={t(group.ids[0] === 'major' ? 'scaleGroup.common' : 'scaleGroup.greek')}>
                {group.ids.map(id => (
                  <option key={id} value={id}>{t(`scale.${id}.label`)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          {t('training.tonalCenter')}
          <select value={tonicPc} onChange={event => onTonicChange(Number(event.target.value))}>
            {TONIC_NAMES_BY_SCALE[scale.id].map((tonicName, pitchClass) => (
              <option key={pitchClass} value={pitchClass}>{displayNoteName(tonicName)}</option>
            ))}
          </select>
        </label>

        {showRegister && (
          <label>
            {t('training.register')}
            <select value={register} onChange={event => onRegisterChange(event.target.value)}>
              {REGISTER_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>{t(`register.${option.id}`)}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="scale-summary">
        <strong>{t('training.notes')}</strong> {noteNames.join(' · ')}
        <span>{t(`scale.${scale.id}.description`)}</span>
        <span>{t('training.relationship')}</span>
      </p>
    </section>
  )
}
