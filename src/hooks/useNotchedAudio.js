import { useCallback, useEffect, useRef, useState } from 'react'
import { clampTinnitusFrequency, getNotchQ } from '../utils/notchedAudio.js'
import { translate as translateMessage } from '../i18n/I18nContext.jsx'

export function useNotchedAudio({ frequency, bandDistanceHz, filterEnabled, volume, translate }) {
  const [fileName, setFileName] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [errorKey, setErrorKey] = useState('')
  const [playlist, setPlaylist] = useState([])
  const [trackIndex, setTrackIndex] = useState(-1)
  const audioRef = useRef(null)
  const objectUrlRef = useRef(null)
  const contextRef = useRef(null)
  const graphRef = useRef(null)
  const referenceOscillatorRef = useRef(null)
  const playlistRef = useRef([])
  const trackIndexRef = useRef(-1)
  const isPlayingRef = useRef(false)
  const activateTrackRef = useRef(null)

  const isSupported = typeof window !== 'undefined' && Boolean(
    window.AudioContext || window.webkitAudioContext
  )

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const updateTime = () => setCurrentTime(audio.currentTime || 0)
    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const handlePlay = () => {
      isPlayingRef.current = true
      setIsPlaying(true)
    }
    const handlePause = () => {
      isPlayingRef.current = false
      setIsPlaying(false)
    }
    const handleEnded = () => {
      isPlayingRef.current = false
      setIsPlaying(false)
      activateTrackRef.current?.(trackIndexRef.current + 1, true)
    }
    const handleError = () => setErrorKey('audio.error.file')

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      try {
        referenceOscillatorRef.current?.stop()
      } catch {
        // The reference tone may already have completed.
      }
      contextRef.current?.close()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      audioRef.current = null
      graphRef.current = null
    }
  }, [])

  const ensureContext = useCallback(async () => {
    if (!isSupported) {
      setErrorKey('audio.error.unsupported')
      return null
    }

    if (!contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      contextRef.current = new AudioContext()
    }
    if (contextRef.current.state !== 'running') await contextRef.current.resume()
    return contextRef.current
  }, [isSupported])

  const updateGraph = useCallback(() => {
    const context = contextRef.current
    const graph = graphRef.current
    if (!context || !graph) return

    const now = context.currentTime
    const safeFrequency = Math.min(clampTinnitusFrequency(frequency), context.sampleRate * 0.45)
    graph.notch.frequency.setTargetAtTime(safeFrequency, now, 0.015)
    graph.notch.Q.setTargetAtTime(getNotchQ(safeFrequency, bandDistanceHz), now, 0.015)
    graph.wetGain.gain.setTargetAtTime(filterEnabled ? 1 : 0, now, 0.015)
    graph.dryGain.gain.setTargetAtTime(filterEnabled ? 0 : 1, now, 0.015)
    graph.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), now, 0.015)
  }, [bandDistanceHz, filterEnabled, frequency, volume])

  useEffect(() => updateGraph(), [updateGraph])

  const ensureGraph = useCallback(async () => {
    const context = await ensureContext()
    if (!context || !audioRef.current) return false

    if (!graphRef.current) {
      const source = context.createMediaElementSource(audioRef.current)
      const notch = context.createBiquadFilter()
      const wetGain = context.createGain()
      const dryGain = context.createGain()
      const masterGain = context.createGain()

      notch.type = 'notch'
      source.connect(notch).connect(wetGain).connect(masterGain)
      source.connect(dryGain).connect(masterGain)
      masterGain.connect(context.destination)
      graphRef.current = { source, notch, wetGain, dryGain, masterGain }
      updateGraph()
    }
    return true
  }, [ensureContext, updateGraph])

  const activateTrack = useCallback((index, autoplay = isPlayingRef.current) => {
    const files = playlistRef.current
    if (index < 0 || index >= files.length) return false
    const audio = audioRef.current
    if (!audio) return false

    audio.pause()
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const file = files[index]
    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl
    audio.src = objectUrl
    audio.load()
    trackIndexRef.current = index
    setTrackIndex(index)
    setFileName(file.name)
    setCurrentTime(0)
    setDuration(0)
    setErrorKey('')

    if (autoplay) {
      void (async () => {
        try {
          if (!await ensureGraph()) return
          await audio.play()
          setErrorKey('')
        } catch (audioError) {
          console.warn('Notched audio playback failed:', audioError)
          setErrorKey('audio.error.playback')
        }
      })()
    }
    return true
  }, [ensureGraph])

  useEffect(() => {
    activateTrackRef.current = activateTrack
    return () => {
      activateTrackRef.current = null
    }
  }, [activateTrack])

  const loadFiles = useCallback(fileList => {
    const candidates = Array.from(fileList || [])
    const files = candidates.filter(file => !file.type || file.type.startsWith('audio/'))
    if (files.length === 0) {
      if (candidates.length > 0) setErrorKey('audio.error.type')
      return false
    }

    playlistRef.current = files
    setPlaylist(files)
    return activateTrack(0, false)
  }, [activateTrack])

  const loadFile = useCallback(file => loadFiles(file ? [file] : []), [loadFiles])

  const play = useCallback(async () => {
    if (!fileName || !audioRef.current) return false
    try {
      if (!await ensureGraph()) return false
      await audioRef.current.play()
      setErrorKey('')
      return true
    } catch (audioError) {
      console.warn('Notched audio playback failed:', audioError)
      setErrorKey('audio.error.playback')
      return false
    }
  }, [ensureGraph, fileName])

  const pause = useCallback(() => audioRef.current?.pause(), [])

  const selectTrack = useCallback(index => activateTrack(index), [activateTrack])
  const previousTrack = useCallback(() => activateTrack(trackIndexRef.current - 1), [activateTrack])
  const nextTrack = useCallback(() => activateTrack(trackIndexRef.current + 1), [activateTrack])

  const seek = useCallback(value => {
    if (!audioRef.current || !Number.isFinite(duration)) return
    audioRef.current.currentTime = Math.max(0, Math.min(duration, Number(value)))
    setCurrentTime(audioRef.current.currentTime)
  }, [duration])

  const playReferenceTone = useCallback(async () => {
    const context = await ensureContext()
    if (!context) return false

    try {
      referenceOscillatorRef.current?.stop()
    } catch {
      // The previous oscillator may already have stopped.
    }

    const oscillator = context.createOscillator()
    const toneGain = context.createGain()
    const now = context.currentTime
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(
      Math.min(clampTinnitusFrequency(frequency), context.sampleRate * 0.45),
      now
    )
    toneGain.gain.setValueAtTime(0.0001, now)
    toneGain.gain.exponentialRampToValueAtTime(0.018, now + 0.03)
    toneGain.gain.setValueAtTime(0.018, now + 0.7)
    toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95)
    oscillator.connect(toneGain).connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 1)
    referenceOscillatorRef.current = oscillator
    oscillator.addEventListener('ended', () => {
      oscillator.disconnect()
      toneGain.disconnect()
      if (referenceOscillatorRef.current === oscillator) referenceOscillatorRef.current = null
    })
    return true
  }, [ensureContext, frequency])

  return {
    isSupported,
    fileName,
    isPlaying,
    currentTime,
    duration,
    tracks: playlist.map(file => file.name),
    trackIndex,
    hasPrevious: trackIndex > 0,
    hasNext: trackIndex >= 0 && trackIndex < playlist.length - 1,
    error: errorKey
      ? (translate?.(errorKey) ?? translateMessage('en', errorKey))
      : '',
    loadFile,
    loadFiles,
    selectTrack,
    previousTrack,
    nextTrack,
    play,
    pause,
    seek,
    playReferenceTone
  }
}
