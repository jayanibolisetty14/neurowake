// Fully dynamic, dependency-free alarm sound engine built on the Web Audio API.
// No external audio files are required -- tones are synthesized in the browser,
// which means alarm sounds work offline and can be themed instantly.

import { ALARM_SOUNDS } from './alarmSounds.js'

let audioCtx = null
let activeOscillators = []
let loopTimer = null
let customAudio = null // For uploaded sound files

function getCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    audioCtx = new AudioContext()
  }
  return audioCtx
}

const SOUND_THEMES = ALARM_SOUNDS.reduce((acc, category) => {
  category.options.forEach(option => {
    if (option.file && option.value !== 'custom_upload') {
      acc[option.value] = option.file
    }
  })
  return acc
}, {})

function playTone(freq, duration, gain) {
  const ctx = getCtx()
  if (freq === 0) return
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gainNode.gain.value = gain
  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.start()
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000)
  osc.stop(ctx.currentTime + duration / 1000)
  activeOscillators.push(osc)
}

export function startAlarmSound(themeKey = 'classic_beep', customSoundFile = null) {
  stopAlarmSound()

  if (themeKey === 'custom_upload' && customSoundFile) {
    customAudio = new Audio(customSoundFile)
    customAudio.loop = true
    customAudio.play()
    return
  }

  const filePath = SOUND_THEMES[themeKey]
  if (filePath) {
    customAudio = new Audio(filePath)
    customAudio.loop = true
    customAudio.play()
    return
  }

  // Fallback to synthesized tones if no file path or custom sound is provided
  // This part is largely for backward compatibility or cases where no file exists.
  const defaultTheme = {
    freqs: [880, 0, 880, 0],
    gap: 260,
    gain: 0.18,
  }
  const theme = defaultTheme // simplified, as theme.freqs is no longer directly derived from SOUND_OPTIONS
  let i = 0

  const tick = () => {
    const freq = theme.freqs[i % theme.freqs.length]
    playTone(freq, theme.gap * 0.9, theme.gain)
    i += 1
    loopTimer = setTimeout(tick, theme.gap)
  }
  tick()
}

export function stopAlarmSound() {
  if (loopTimer) {
    clearTimeout(loopTimer)
    loopTimer = null
  }
  activeOscillators.forEach((o) => {
    try { o.stop() } catch (e) { /* already stopped */ }
  })
  activeOscillators = []
  if (customAudio) {
    customAudio.pause()
    customAudio.currentTime = 0
    customAudio = null
  }
}

export function playSuccessChime() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 220, 0.15), idx * 90)
  })
}

export function playErrorBuzz() {
  playTone(160, 220, 0.2)
}

export const SOUND_OPTIONS = Object.keys(SOUND_THEMES) // Keep for backward compatibility if needed, though now using ALARM_SOUNDS directly
