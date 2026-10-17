import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"

const POLL_MS = 20_000

export const useCatalog = () => useQuery({ queryKey: ["catalog"], queryFn: api.catalog, staleTime: Infinity })
export const useMeta = () => useQuery({ queryKey: ["meta"], queryFn: api.meta, staleTime: Infinity })

// One request for all prices and one for all reports. Crop filtering happens in the browser,
// which keeps the number of calls to the rate-limited public Arkiv RPC low.
export const usePrices = () =>
  useQuery({ queryKey: ["prices"], queryFn: api.prices, refetchInterval: POLL_MS })
export const useReports = () =>
  useQuery({ queryKey: ["reports"], queryFn: api.reports, refetchInterval: POLL_MS })

export function useRefreshAfterWrite() {
  const qc = useQueryClient()
  return () => Promise.all([qc.invalidateQueries({ queryKey: ["prices"] }), qc.invalidateQueries({ queryKey: ["reports"] })])
}

export function usePostReport() {
  const refresh = useRefreshAfterWrite()
  return useMutation({ mutationFn: api.postReport, onSuccess: refresh })
}

export function useVote() {
  const refresh = useRefreshAfterWrite()
  return useMutation({
    mutationFn: (v: { key: string; verdict: "confirm" | "dispute"; voterId: string }) =>
      api.vote(v.key, { verdict: v.verdict, voterId: v.voterId }),
    onSuccess: refresh,
  })
}
