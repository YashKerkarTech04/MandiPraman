import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import { I18nProvider } from "./i18n"
import "./styles.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The free backend host sleeps after 15 idle minutes and takes about a minute to wake,
      // so keep retrying for ~45 seconds (1.5s, 3s, 4.5s ... capped at 8s) before showing an error.
      retry: 8,
      retryDelay: (attempt) => Math.min(1500 * (attempt + 1), 8000),
      staleTime: 5_000,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>,
)
