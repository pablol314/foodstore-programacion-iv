import axios from 'axios'

import { api } from './api'
import { useNotificationStore } from '@/store/notificationStore'

api.interceptors.request.use((config) => config)
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const url = error.config?.url ?? ''
      if (error.response?.status === 401 && !url.includes('/auth/token') && !url.includes('/auth/me')) {
        window.dispatchEvent(new Event('foodstore:session-expired'))
      }
      if (error.response?.status === 400 && error.response.data?.detail === 'Cuenta de usuario desactivada.') {
        window.dispatchEvent(new Event('foodstore:session-expired'))
      }
      if (error.response?.status === 403) {
        useNotificationStore.getState().showNotification('Acceso denegado.')
      }
    }
    return Promise.reject(error)
  },
)
