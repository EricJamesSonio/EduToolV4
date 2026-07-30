import { useQuery } from '@tanstack/react-query'
import { landingApi } from '@/api/public/landing.api'

export function useLandingOrganizations() {
  return useQuery({
    queryKey: ['landing', 'organizations'],
    queryFn: landingApi.getOrganizations,
    staleTime: 5 * 60 * 1000,
  })
}
