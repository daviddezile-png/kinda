import { LandingClient } from "@/components/landing/LandingClient"

// The public landing page. All the motion lives in LandingClient; this stays a
// server component so metadata/streaming behave normally.
export default function Home() {
  return <LandingClient />
}
