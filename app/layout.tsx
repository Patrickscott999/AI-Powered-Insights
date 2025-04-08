import type { Metadata } from "next"
import { Inter, Nunito_Sans } from "next/font/google"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
})

const nunito = Nunito_Sans({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-nunito',
  weight: ['400', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: "AI-Powered Data Insights",
  description: "Upload your CSV data and get AI-generated insights, visualizations, and data analysis powered by machine learning",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  authors: [{ name: "AI Powered Insights Team" }],
  keywords: ["data analysis", "AI insights", "data visualization", "analytics dashboard", "CSV analysis"],
  openGraph: {
    title: "AI-Powered Data Insights",
    description: "Upload your CSV data and get AI-generated insights, visualizations, and data analysis powered by machine learning",
    type: "website",
    images: [{ url: "https://via.placeholder.com/1200x630" }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${nunito.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  )
}
