import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HomeDashboard } from './HomeDashboard.jsx'

describe('HomeDashboard', () => {
  it('separates the three practice areas from the listening tool', () => {
    const onSelectArea = vi.fn()
    render(
      <HomeDashboard
        onSelectArea={onSelectArea}
        tonalityLabel="C Major"
        notationLabel="Scale degrees"
        instrumentLabel="Guitar"
        onOpenSettings={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: 'Train the whole musician' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: /Start/i })).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /Rhythm/i }))
    expect(onSelectArea).toHaveBeenCalledWith('rhythm')

    fireEvent.click(screen.getByRole('button', { name: /Personalized listening/i }))
    expect(onSelectArea).toHaveBeenCalledWith('tinnitus')
  })
})
