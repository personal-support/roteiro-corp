import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-open-sans",
});

export const viewport: Viewport = {
  themeColor: "#212771",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Roteiro Corp — Gestão de Viagens Corporativas",
  description: "Sistema de gestão de viagens corporativas da Consuldata. Solicite traslados, passagens, locação de veículos e hospedagem de forma rápida e organizada.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Roteiro Corp",
  },
  openGraph: {
    title: "Roteiro Corp",
    description: "Gestão de viagens corporativas — simples, rápido e inteligente.",
    url: "https://roteiro-corp.vercel.app",
    siteName: "Roteiro Corp",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Roteiro Corp" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roteiro Corp",
    description: "Gestão de viagens corporativas — simples, rápido e inteligente.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={openSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
