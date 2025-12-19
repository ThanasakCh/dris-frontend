import axios from 'axios'
import { API_CONFIG } from './api'

axios.defaults.baseURL = API_CONFIG.BASE_URL
axios.defaults.timeout = 120000 // 120 seconds for GEE analysis

axios.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)

export default axios
