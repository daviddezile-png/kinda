import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kinda",
  description:
    "Kinda is a playful learning app where children aged 3–6 learn letters, numbers and counting through voice-guided games, songs, animations, and rewards.",
  applicationName: "Kinda",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kinda",
  },
  icons: {
    apple: "/icons/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b9d",
  width: "device-width",
  initialScale: 1,
  // A stray pinch-zoom mid-lesson is a small disaster for a 3-year-old;
  // the app's type/targets are already sized for little hands.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} h-full antialiased`}>
      <body className="font-sans flex min-h-full flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
