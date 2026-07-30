import React, { useEffect, useRef, useState } from 'react'
import { AlarmClock, Volume2, VolumeX, CheckCircle2, XCircle, Clock3 } from 'lucide-react'
import client from '../api/client.js'
import { startAlarmSound, stopAlarmSound, playSuccessChime, playErrorBuzz } from '../utils/sound.js'

/**
 * Full-screen "alarm is ringing" experience. The user must solve a
 * dynamically generated cognitive challenge (math / logic / memory /
 * pattern / riddle / quiz / word) to dismiss the alarm. Snoozing is
 * allowed up to the alarm's configured limit, after which the difficulty
 * increases each time (anti-snooze workflow).
 */
export default function RingModal({ alarm, onResolved }) {
  const [question, setQuestion] = useState(null)
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState(null) // { correct, message, correct_answer }
  const [muted, setMuted] = useState(false)
  const [memoryPhase, setMemoryPhase] = useState('show') // 'show' | 'answer'
  const [loading, setLoading] = useState(true)
  const [localSnoozeCount, setLocalSnoozeCount] = useState(alarm?.snooze_count_today ?? 0)
  const startTimeRef = useRef(Date.now())

  useEffect(() => {
    if (!muted) startAlarmSound(alarm?.sound || 'classic_beep')
    return () => stopAlarmSound()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (question?.challenge_type === 'memory') {
      setMemoryPhase('show')
      const seconds = question?.meta?.show_seconds || 4
      const t = setTimeout(() => setMemoryPhase('answer'), seconds * 1000)
      return () => clearTimeout(t)
    }
  }, [question])

  async function fetchChallenge() {
    setLoading(true)
    setFeedback(null)
    setAnswer('')
    try {
      const url = alarm?.id ? `/api/alarms/${alarm.id}/trigger` : '/api/alarms/demo/trigger'
      const { data } = await client.post(url)
      setQuestion(data)
      startTimeRef.current = Date.now()
    } catch (e) {
      setQuestion(null)
    } finally {
      setLoading(false)
    }
  }

  function toggleMute() {
    if (muted) {
      startAlarmSound(alarm?.sound || 'classic_beep')
    } else {
      stopAlarmSound()
    }
    setMuted(!muted)
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    if (!question) return
    const timeToSolve = (Date.now() - startTimeRef.current) / 1000
    try {
      const { data } = await client.post('/api/alarms/answer', {
        attempt_id: question.attempt_id,
        answer,
        time_to_solve_seconds: timeToSolve,
      })
      setFeedback(data)
      if (data.correct) {
        stopAlarmSound()
        playSuccessChime()
        setTimeout(() => onResolved(), 1400)
      } else {
        playErrorBuzz()
        setTimeout(() => fetchChallenge(), 1200)
      }
    } catch (err) {
      // ignore
    }
  }

  async function handleSnooze() {
    if (!alarm?.id) {
      // demo alarm has no snooze limit tracking server-side
      fetchChallenge()
      return
    }
    try {
      const { data } = await client.post(`/api/alarms/${alarm.id}/snooze`)
      setQuestion(data)
      setLocalSnoozeCount((count) => count + 1)
      startTimeRef.current = Date.now()
      setFeedback(null)
      setAnswer('')
    } catch (err) {
      alert(err?.response?.data?.detail || 'Unable to snooze — solve the challenge to dismiss the alarm.')
    }
  }

  const snoozeCount = alarm?.id ? localSnoozeCount : 0
  const maxSnoozes = alarm?.max_snoozes ?? 3
  const canSnooze = alarm?.id ? snoozeCount < maxSnoozes : true

  return (
    <div className="fixed inset-0 z-50 bg-night-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        <div className="absolute -inset-6 rounded-[2rem] bg-brand-600/20 animate-pulseRing" />
        <div className="relative glass rounded-3xl p-6 md:p-8 border border-white/10 shadow-glow">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => onResolved()}
              className="text-slate-300 hover:text-white text-lg"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center">
                <AlarmClock className="text-white" size={24} />
              </div>
              <div>
                <p className="font-display font-bold text-xl">{alarm?.label || 'Alarm'}</p>
                <p className="text-xs text-slate-400">Solve the challenge to wake up & dismiss</p>
              </div>
            </div>
            <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/10 text-slate-300">
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          {loading && <p className="text-center text-slate-300 py-10">Generating your challenge…</p>}

          {!loading && question && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] uppercase tracking-wide bg-brand-800 text-brand-200 px-2 py-1 rounded-full">
                  {question.challenge_type}
                </span>
                <span className="text-[11px] uppercase tracking-wide bg-white/5 text-slate-300 px-2 py-1 rounded-full">
                  {question.difficulty}
                </span>
              </div>

              {question.challenge_type === 'memory' ? (
                <MemoryChallenge
                  meta={question.meta}
                  phase={memoryPhase}
                  answer={answer}
                  setAnswer={setAnswer}
                  onSubmit={handleSubmit}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-lg font-medium leading-snug">{question.prompt}</p>
                  <input
                    autoFocus
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer…"
                    className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-semibold transition-colors"
                  >
                    Submit Answer
                  </button>
                </form>
              )}

              {feedback && (
                <div
                  className={`mt-4 flex items-start gap-2 p-3 rounded-xl text-sm ${
                    feedback.correct ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {feedback.correct ? <CheckCircle2 size={18} className="mt-0.5" /> : <XCircle size={18} className="mt-0.5" />}
                  <span>{feedback.message}{feedback.correct_answer ? ` (Answer: ${feedback.correct_answer})` : ''}</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handleSnooze}
                  disabled={!canSnooze}
                  className={`flex items-center gap-2 text-sm border rounded-lg px-4 py-2 transition-colors ${canSnooze ? 'text-slate-300 hover:text-white border-white/10 hover:border-white/20' : 'text-slate-600 border-white/5 cursor-not-allowed bg-white/5'}`}
                >
                  <Clock3 size={16} /> Snooze {alarm?.id ? `(${snoozeCount}/${maxSnoozes})` : ''}
                </button>
                <span className="text-xs text-slate-500">Difficulty adapts to your performance</span>
              </div>
            </div>
          )}

          {!loading && !question && (
            <p className="text-center text-slate-400 py-6">Could not load a challenge. Please check your connection.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MemoryChallenge({ meta, phase, answer, setAnswer, onSubmit }) {
  const sequence = meta?.sequence || []
  if (phase === 'show') {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-slate-400 mb-4">Memorize this sequence…</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {sequence.map((d, i) => (
            <span key={i} className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-xl font-bold">
              {d}
            </span>
          ))}
        </div>
      </div>
    )
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-lg font-medium">Now type the sequence you saw:</p>
      <input
        autoFocus
        inputMode="numeric"
        value={answer}
        onChange={(e) => setAnswer(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder="e.g. 48213"
        className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 tracking-widest text-xl text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button type="submit" className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-semibold transition-colors">
        Submit Answer
      </button>
    </form>
  )
}
