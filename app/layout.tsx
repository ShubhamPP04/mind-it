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
    shortcut: "/logo.png"
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
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
