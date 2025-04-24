import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from '@/contexts/AuthContext'
import { Providers } from "@/components/providers";
import Head from 'next/head';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mind It",
  description: "A modern note-taking app",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any"
      },
      {
        url: "/logo.png",
        type: "image/png"
      }
    ],
    apple: {
      url: "/logo.png",
      type: "image/png"
    },
    shortcut: "/favicon.ico"
  },
  // Explicitly prevent Vercel's default favicon
  other: {
    "msapplication-TileColor": "#000000",
    "msapplication-config": "none",
    "manifest": "/site.webmanifest",
    "generator": "Next.js",
    "applicationName": "Mind It",
    "referrer": "origin-when-cross-origin",
    "keywords": ["Mind It", "notes", "knowledge management"],
    "creator": "Mind It",
    "publisher": "Mind It",
    "format-detection": "no"
  },
  // Prevent automatic favicon generation
  metadataBase: new URL('http://localhost:3000'),
  verification: {
    other: {
      "disableVercelFavicon": "true"
    }
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Force the browser to use our favicon and prevent Vercel's default favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta name="msapplication-TileImage" content="/logo.png" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="generator" content="Next.js" />
        <meta name="vercel-favicon" content="disabled" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>

      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          suppressHydrationWarning
        >
          <AuthProvider>
            <Providers>
              {children}
            </Providers>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
