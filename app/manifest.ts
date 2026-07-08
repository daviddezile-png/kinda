import type { MetadataRoute } from "next"

// Web app manifest (served at /manifest.webmanifest by the App Router).
// Icons come from scripts/gen-pwa-icons.py.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kinda — Learn & Play",
    short_name: "Kinda",
    description:
      "Letters, numbers and counting for ages 3–6 — taught by voice, learned by touch.",
    id: "/",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fff5f8",
    theme_color: "#ff6b9d",
    categories: ["education", "kids"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
