export const MIN_TINNITUS_FREQUENCY = 125
export const MAX_TINNITUS_FREQUENCY = 12000

export const clampTinnitusFrequency = value => Math.max(
  MIN_TINNITUS_FREQUENCY,
  Math.min(MAX_TINNITUS_FREQUENCY, Math.round(Number(value) || 6000))
)

export const getNotchBounds = (centerFrequency, widthInOctaves = 1) => {
  const center = clampTinnitusFrequency(centerFrequency)
  const safeWidth = Math.max(0.25, Math.min(1.5, Number(widthInOctaves) || 1))
  const halfBandRatio = 2 ** (safeWidth / 2)
  return {
    lower: center / halfBandRatio,
    upper: center * halfBandRatio
  }
}

export const getNotchQ = (centerFrequency, widthInOctaves = 1) => {
  const { lower, upper } = getNotchBounds(centerFrequency, widthInOctaves)
  return centerFrequency / (upper - lower)
}

export const frequencyToSlider = frequency => Math.log2(clampTinnitusFrequency(frequency))

export const sliderToFrequency = value => clampTinnitusFrequency(2 ** Number(value))

export const formatFrequency = frequency => (
  frequency >= 1000
    ? `${(frequency / 1000).toFixed(frequency % 1000 === 0 ? 0 : 1)} kHz`
    : `${Math.round(frequency)} Hz`
)

export const formatAudioTime = seconds => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const totalSeconds = Math.floor(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`
}
