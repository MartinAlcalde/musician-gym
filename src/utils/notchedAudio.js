export const MIN_TINNITUS_FREQUENCY = 125
export const MAX_TINNITUS_FREQUENCY = 12000
export const MIN_NOTCH_DISTANCE = 10
export const MAX_NOTCH_DISTANCE = 6000
export const MIN_FILTER_FREQUENCY = 20
export const MAX_FILTER_FREQUENCY = 20000

export const clampTinnitusFrequency = value => Math.max(
  MIN_TINNITUS_FREQUENCY,
  Math.min(MAX_TINNITUS_FREQUENCY, Math.round(Number(value) || 6000))
)

export const getMaxNotchDistance = centerFrequency => {
  const center = clampTinnitusFrequency(centerFrequency)
  return Math.max(MIN_NOTCH_DISTANCE, Math.floor(Math.min(
    MAX_NOTCH_DISTANCE,
    center - MIN_FILTER_FREQUENCY,
    MAX_FILTER_FREQUENCY - center
  )))
}

export const clampNotchDistance = (value, centerFrequency) => Math.max(
  MIN_NOTCH_DISTANCE,
  Math.min(getMaxNotchDistance(centerFrequency), Math.round(Number(value) || 500))
)

export const getNotchBounds = (centerFrequency, distanceHz = 500) => {
  const center = clampTinnitusFrequency(centerFrequency)
  const safeDistance = clampNotchDistance(distanceHz, center)
  return {
    lower: center - safeDistance,
    upper: center + safeDistance
  }
}

export const getNotchQ = (centerFrequency, distanceHz = 500) => {
  const center = clampTinnitusFrequency(centerFrequency)
  const { lower, upper } = getNotchBounds(center, distanceHz)
  return center / (upper - lower)
}

export const frequencyToSlider = frequency => Math.log2(clampTinnitusFrequency(frequency))

export const sliderToFrequency = value => clampTinnitusFrequency(2 ** Number(value))

export const frequencyToSliderPercent = frequency => {
  const sliderMin = frequencyToSlider(MIN_TINNITUS_FREQUENCY)
  const sliderMax = frequencyToSlider(MAX_TINNITUS_FREQUENCY)
  return ((frequencyToSlider(frequency) - sliderMin) / (sliderMax - sliderMin)) * 100
}

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
