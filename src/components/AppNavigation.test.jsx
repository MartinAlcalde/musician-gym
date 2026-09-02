import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppNavigation } from './AppNavigation.jsx'

describe('AppNavigation', () => {
  it('uses a grouped navigation and exposes settings only once', () => {
    const onSelectArea = vi.fn()
    const onOpenSettings = vi.fn()
    render(
      <AppNavigation
        activeArea="rhythm"
        isOpen={false}
        onSelectArea={onSelectArea}
        onOpenSettings={onOpenSettings}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Rhythm' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: /Tinnitus/i })).toBeTruthy()
    expect(screen.getByText('Auditory rehabilitation')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Open settings' })).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Ear' }))
    expect(onSelectArea).toHaveBeenCalledWith('ear')
  })
})
