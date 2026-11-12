import { api } from '@/shared/api/api'
import type { User } from '@/shared/types/foodstore'

export const authApi = {
  async login(username: string, password: string): Promise<void> {
    const body = new URLSearchParams({ username, password })
    await api.post('/auth/token', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  async register(payload: { username: string; full_name: string; email: string; password: string }): Promise<User> {
    return (await api.post<User>('/auth/register', payload)).data
  },
  async me(): Promise<User> { return (await api.get<User>('/auth/me')).data },
  async logout(): Promise<void> { await api.post('/auth/logout') },
}
