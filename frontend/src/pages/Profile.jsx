import React, { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import client from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

const DIFFICULTIES = ['beginner', 'easy', 'medium', 'hard', 'expert']

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    email: '', preferred_wake_time: '07:00', sleep_duration_minutes: 480,
    timezone: 'UTC', productivity_goal: '', difficulty_preference: 'easy', habit_preferences: '',
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email,
        preferred_wake_time: user.preferred_wake_time,
        sleep_duration_minutes: user.sleep_duration_minutes,
        timezone: user.timezone,
        productivity_goal: user.productivity_goal || '',
        difficulty_preference: user.difficulty_preference,
        habit_preferences: user.habit_preferences || '',
      })
    }
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    await client.put('/api/users/me', { ...form, sleep_duration_minutes: Number(form.sleep_duration_minutes) })
    await refreshUser()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Your Profile</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your sleep schedule, goals and challenge preferences.</p>
      </header>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 border border-white/10 space-y-4">
        <div>
          <label className="text-sm text-slate-300 mb-1 block">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Preferred wake time</label>
            <input
              type="time"
              value={form.preferred_wake_time}
              onChange={(e) => setForm({ ...form, preferred_wake_time: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Sleep duration (minutes)</label>
            <input
              type="number"
              min={60}
              max={720}
              value={form.sleep_duration_minutes}
              onChange={(e) => setForm({ ...form, sleep_duration_minutes: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Timezone</label>
            <input
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Starting difficulty</label>
            <select
              value={form.difficulty_preference}
              onChange={(e) => setForm({ ...form, difficulty_preference: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-300 mb-1 block">Productivity goal</label>
          <input
            value={form.productivity_goal}
            onChange={(e) => setForm({ ...form, productivity_goal: e.target.value })}
            placeholder="e.g. Get up early to exercise before work"
            className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="text-sm text-slate-300 mb-1 block">Preferred challenge types (comma separated)</label>
          <input
            value={form.habit_preferences}
            onChange={(e) => setForm({ ...form, habit_preferences: e.target.value })}
            placeholder="math, riddle, memory"
            className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <button className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 transition-colors px-5 py-2.5 rounded-xl font-semibold text-sm">
          <Save size={16} /> Save changes
        </button>
        {saved && <p className="text-emerald-400 text-sm">Profile updated!</p>}
      </form>
    </div>
  )
}
