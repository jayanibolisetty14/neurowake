import axios from 'axios'

// Use a relative path by default so the app works in both
// development (Vite proxy) and deployed Docker/Nginx environments.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

const client = axios.create({ baseURL })

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('nw_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('nw_token')
      localStorage.removeItem('nw_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default client
