import axios from 'axios'
import { API_BASE_URL } from '@/config/api.config'

const publicClient = axios.create({ baseURL: API_BASE_URL })

export interface PublicOrganization {
  id: string
  name: string
  description: string | null
  address: string | null
  logo_url: string | null
}

export const landingApi = {
  getOrganizations: async (): Promise<PublicOrganization[]> => {
    const res = await publicClient.get('/public/organizations')
    return res.data.data
  },
}
