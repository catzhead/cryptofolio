import { useQuery } from '@tanstack/react-query'
import { fetchCurrentFXRate } from '../lib/fx'

export function useCurrentFXRate() {
  return useQuery({
    queryKey: ['fxRate', 'current'],
    queryFn: fetchCurrentFXRate,
  })
}
