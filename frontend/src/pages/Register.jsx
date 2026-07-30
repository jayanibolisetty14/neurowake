import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BellRing, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', email: '', password: '', preferred_wake_time: '07:00', role: 'user',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.detail || 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-3xl p-8 border border-white/10 shadow-glow">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3 shadow-glow">
            <BellRing className="text-white" size={28} />
          </div>
          <h1 className="font-display font-bold text-2xl">Create your account</h1>
          <p className="text-sm text-slate-400">Set up your cognitive wake-up profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Password</label>
            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Preferred wake time</label>
              <input
                type="time"
                value={form.preferred_wake_time}
                onChange={(e) => setForm({ ...form, preferred_wake_time: e.target.value })}
                className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl bg-night-800 border border-white/10 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="user">User</option>
                <option value="wellness_coach">Wellness Coach</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-semibold transition-colors disabled:opacity-60"
          >
            <UserPlus size={18} /> {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-slate-400 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
