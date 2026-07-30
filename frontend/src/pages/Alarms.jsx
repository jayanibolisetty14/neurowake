import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, PlayCircle, AlarmClockOff, AlarmClockCheck } from 'lucide-react'
import client from '../api/client.js'
import { SOUND_OPTIONS, startAlarmSound, stopAlarmSound } from '../utils/sound.js'
import RingModal from '../components/RingModal.jsx'

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const CHALLENGE_TYPES = ['math', 'logic', 'memory', 'pattern', 'riddle', 'quiz', 'word']
const ALARM_TYPES = ['daily', 'weekday', 'weekend', 'one_time', 'smart_adaptive']
const DIFFICULTY_OPTIONS = ['beginner', 'easy', 'medium', 'hard']

const emptyForm = {
  label: 'Morning Alarm',
  time: '07:00',
  ampm: 'AM',
  days_of_week: DAY_OPTIONS.join(','),
  alarm_type: 'daily',
  sound: 'classic_beep',
  challenge_type: '',
  difficulty: 'easy',
  max_snoozes: 0,
}

export default function Alarms() {
  const [alarms, setAlarms] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [ringingAlarm, setRingingAlarm] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await client.get('/api/alarms')
    setAlarms(data)
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEdit(alarm) {
    const [hour, minute] = alarm.time.split(':').map(Number)
    const isPM = hour >= 12
    const displayHour = hour % 12 || 12

    setEditing(alarm)
    setForm({
      label: alarm.label,
      time: `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      ampm: isPM ? 'PM' : 'AM',
      days_of_week: alarm.days_of_week,
      alarm_type: alarm.alarm_type,
      sound: alarm.sound,
      challenge_type: alarm.challenge_type || '',
      difficulty: alarm.difficulty || 'easy',
      max_snoozes: alarm.max_snoozes,
    })
    setShowForm(true)
  }

  function toggleDay(day) {
    const days = form.days_of_week.split(',').filter(Boolean)
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    setForm({ ...form, days_of_week: next.join(',') })
  }

  function convertTo24Hour(time, ampm) {
    const [hourText, minute] = time.split(':')
    let hour = Number(hourText) % 12
    if (ampm === 'PM') hour += 12
    return `${String(hour).padStart(2, '0')}:${minute}`
  }

  async function handleSave(e) {
    e.preventDefault()
    const payload = {
      ...form,
      time: convertTo24Hour(form.time, form.ampm),
      challenge_type: form.challenge_type || null,
      max_snoozes: Number(form.max_snoozes),
    }
    if (editing) {
      await client.put(`/api/alarms/${editing.id}`, payload)
    } else {
      await client.post('/api/alarms', payload)
    }
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this alarm?')) return
    await client.delete(`/api/alarms/${id}`)
    load()
  }

  async function toggleActive(alarm) {
    await client.put(`/api/alarms/${alarm.id}`, { is_active: !alarm.is_active })
    load()
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Your Alarms</h1>
          <p className="text-slate-400 text-sm mt-1">Create, customize and test your intelligent alarms.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 transition-colors px-4 py-2.5 rounded-xl font-semibold text-sm"
        >
          <Plus size={18} /> New Alarm
        </button>
      </header>

      {loading ? (
        <p className="text-slate-400">Loading alarms…</p>
      ) : alarms.length === 0 ? (
        <div className="glass rounded-2xl p-10 border border-white/10 text-center text-slate-400">
          No alarms yet. Create your first intelligent alarm to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alarms.map((alarm) => (
            <div key={alarm.id} className="glass rounded-2xl p-5 border border-white/10 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-display font-bold">{alarm.time}</p>
                  <p className="text-slate-300 text-sm">{alarm.label}</p>
                </div>
                <button onClick={() => toggleActive(alarm)} title="Toggle active">
                  {alarm.is_active ? (
                    <AlarmClockCheck className="text-emerald-400" size={22} />
                  ) : (
                    <AlarmClockOff className="text-slate-500" size={22} />
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {alarm.days_of_week.split(',').filter(Boolean).map((d) => (
                  <span key={d} className="text-[11px] bg-white/5 px-2 py-1 rounded-full text-slate-300">{d}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="capitalize bg-brand-800/60 text-brand-200 px-2 py-1 rounded-full">{alarm.alarm_type.replace('_', ' ')}</span>
                <span className="capitalize bg-white/5 px-2 py-1 rounded-full">{alarm.challenge_type || 'random challenge'}</span>
                <span className="bg-white/5 px-2 py-1 rounded-full">{alarm.sound.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => setRingingAlarm(alarm)}
                  className="flex items-center gap-1.5 text-sm text-brand-300 hover:text-brand-200"
                >
                  <PlayCircle size={16} /> Test ring
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => openEdit(alarm)} className="text-slate-400 hover:text-white">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(alarm.id)} className="text-slate-400 hover:text-rose-400">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="glass w-full max-w-lg rounded-3xl p-6 border border-white/10 space-y-4">
            <h2 className="font-display font-bold text-xl">{editing ? 'Edit Alarm' : 'New Alarm'}</h2>

            <div>
              <label className="text-sm text-slate-300 mb-1 block">Label</label>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Time</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    required
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <select
                    value={form.ampm}
                    onChange={(e) => setForm({ ...form, ampm: e.target.value })}
                    className="w-28 rounded-xl bg-night-800 border border-white/10 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Alarm type</label>
                <select
                  value={form.alarm_type}
                  onChange={(e) => setForm({ ...form, alarm_type: e.target.value })}
                  className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {ALARM_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-1 block">Repeat on</label>
              <div className="flex flex-wrap gap-2">
                {DAY_OPTIONS.map((day) => {
                  const active = form.days_of_week.split(',').includes(day)
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        active ? 'bg-brand-600 text-white' : 'bg-white/5 text-slate-400'
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Challenge type</label>
                <select
                  value={form.challenge_type}
                  onChange={(e) => setForm({ ...form, challenge_type: e.target.value })}
                  className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Random (recommended)</option>
                  {CHALLENGE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {DIFFICULTY_OPTIONS.map((level) => (
                    <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Alarm sound</label>
                <div className="flex items-center gap-2">
                  <select
                    value={form.sound}
                    onChange={(e) => setForm({ ...form, sound: e.target.value })}
                    className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {SOUND_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      stopAlarmSound()
                      startAlarmSound(form.sound)
                      setTimeout(() => stopAlarmSound(), 1800)
                    }}
                    className="h-11 w-11 rounded-xl bg-white/5 text-slate-200 hover:bg-white/10 transition-colors"
                    aria-label="Preview sound"
                  >
                    ▶
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Max snoozes allowed</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, max_snoozes: Math.max(0, Number(form.max_snoozes) - 1) })}
                    className="h-11 w-11 rounded-xl bg-white/5 text-slate-200 hover:bg-white/10 transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={form.max_snoozes}
                    onChange={(e) => setForm({ ...form, max_snoozes: Math.max(0, Number(e.target.value)) })}
                    className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, max_snoozes: Number(form.max_snoozes) + 1 })}
                    className="h-11 w-11 rounded-xl bg-white/5 text-slate-200 hover:bg-white/10 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>


            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300">
                Cancel
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 font-semibold">
                Save Alarm
              </button>
            </div>
          </form>
        </div>
      )}

      {ringingAlarm && (
        <RingModal
          alarm={ringingAlarm}
          onResolved={() => {
            setRingingAlarm(null)
            load()
          }}
        />
      )}
    </div>
  )
}
