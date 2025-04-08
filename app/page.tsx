"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { DataVisualizer } from "@/components/data-visualizer"
import { InsightsSummary } from "@/components/insights-summary"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [data, setData] = useState<any[] | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any | null>(null)

  const handleFileUpload = async (file: File) => {
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append("file", file)

    try {
      console.log("Uploading file:", file.name)
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        console.log("File processed successfully:", result)
        setData(result.data)
        setSummary(result.insights)
        setStatistics(result.statistics)
      } else {
        console.error("Failed to process data:", result)
        setError(result.error || "Failed to process data")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setError(error instanceof Error ? error.message : "Error uploading file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen gradient-bg py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="text-center mb-10 float-animation">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">AI-Powered Insights</h1>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Upload your CSV data file to generate visualizations and AI-powered insights automatically.
          </p>
        </header>
        
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-slate-200 card-hover">
          <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
            <span className="inline-block w-8 h-8 mr-2 rounded-full gradient-primary flex items-center justify-center text-white">
              1
            </span>
            Upload Your Data
          </h2>
          <FileUpload onUpload={handleFileUpload} />
        </div>
        
        {loading && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-blue-100 pulse-animation">
            <div className="flex items-center justify-center">
              <div className="rounded-full h-12 w-12 border-4 border-t-blue-500 border-b-blue-700 border-l-blue-600 border-r-blue-400 animate-spin mr-3"></div>
              <div>
                <p className="text-blue-600 font-medium">Processing your file...</p>
                <p className="text-slate-500 text-sm">This may take a moment while we analyze your data</p>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full mt-6 overflow-hidden">
              <div className="h-full gradient-primary shimmer rounded-full w-2/3"></div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-red-200">
            <div className="flex items-start">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-1">Error</h3>
                <p className="text-red-600">{error}</p>
                <Button 
                  className="mt-4 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 card-hover">
              <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
                <span className="inline-block w-8 h-8 mr-2 rounded-full gradient-primary flex items-center justify-center text-white">
                  2
                </span>
                Data Visualization
              </h2>
              <DataVisualizer data={data} statistics={statistics} />
            </div>
            
            {summary && (
              <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 card-hover">
                <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
                  <span className="inline-block w-8 h-8 mr-2 rounded-full gradient-primary flex items-center justify-center text-white">
                    3
                  </span>
                  AI-Generated Insights
                </h2>
                <InsightsSummary summary={summary} />
              </div>
            )}
          </div>
        )}
        
        <footer className="mt-12 text-center">
          <div className="py-4 px-6 bg-white bg-opacity-50 rounded-xl backdrop-filter backdrop-blur-sm inner-border inline-block">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} AI-Powered Insights App</p>
          </div>
        </footer>
      </div>
    </main>
  )
}
