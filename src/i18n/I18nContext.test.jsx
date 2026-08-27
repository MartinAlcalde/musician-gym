import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { I18nProvider, translate, translations, useI18n } from './I18nContext.jsx'

function LanguageProbe() {
  const { locale, setLocale, t } = useI18n()
  return (
    <div>
      <span>{locale}</span>
      <strong>{t('nav.ear')}</strong>
      <button type="button" onClick={() => setLocale('es')}>Español</button>
    </div>
  )
}

describe('localization', () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
  })

  it('keeps English and Spanish catalogs in sync', () => {
    expect(Object.keys(translations.es).sort()).toEqual(Object.keys(translations.en).sort())
    expect(translate('es', 'scale.major.label')).toBe('Mayor · Jónico')
    expect(translate('es', 'stats.visible', { attempts: 3, correct: 2, accuracy: 67 }))
      .toBe('Intentos: 3 | Correctos: 2 | Precisión: 67%')
  })

  it('switches language live, updates the document, and persists the choice', () => {
    render(
      <I18nProvider>
        <LanguageProbe />
      </I18nProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Español' }))

    expect(screen.getByText('Entrenamiento auditivo')).toBeTruthy()
    expect(document.documentElement.lang).toBe('es')
    expect(localStorage.getItem('musician-gym-language')).toBe('es')
  })
})
