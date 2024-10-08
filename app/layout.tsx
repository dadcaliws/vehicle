import React from 'react'

export const metadata = {
  title: 'Fleet Management System',
  description: 'A comprehensive system for managing vehicle fleets',
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
