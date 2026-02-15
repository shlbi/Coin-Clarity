import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Coin Clarity - Crypto Token Risk Analysis',
  description: 'Analyze crypto tokens to detect fraud and scam risk',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
