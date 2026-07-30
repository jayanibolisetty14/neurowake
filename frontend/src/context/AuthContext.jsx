import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import client from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('nw_user')
    return raw ? JSON.parse(raw) : null
  })
  const [loading, setLoading] = useState(true)

  const persist = (token, userData) => {
    localStorage.setItem('nw_token', token)
    localStorage.setItem('nw_user', JSON.stringify(userData))
    setUser(userData)
  }

  const login = useCallback(async (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const { data } = await client.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    persist(data.access_token, data.user)
    return data.user
  }, [])

  const demoLogin = useCallback(async () => {
    const { data } = await client.post('/api/auth/demo')
    persist(data.access_token, data.user)
    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await client.post('/api/auth/register', payload)
    persist(data.access_token, data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nw_token')
    localStorage.removeItem('nw_user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await client.get('/api/users/me')
      localStorage.setItem('nw_user', JSON.stringify(data))
      setUser(data)
    } catch (e) {
      // token invalid / expired -- interceptor will redirect
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('nw_token')
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, demoLogin, register, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
