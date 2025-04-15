"use client"

import { useState, useCallback } from "react"
import { FileUpload } from "@/components/file-upload"
import { DataVisualizer } from "@/components/data-visualizer"
import { InsightsSummary } from "@/components/insights-summary"
import { DataChat } from "@/components/data-chat"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Home() {
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [selectedVisualization, setSelectedVisualization] = useState({ type: '', config: {}});

  const handleFileUpload = async (file: File) => {
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error('Failed to process file')
      }
      
      const result = await response.json()
      setData(result.data || [])
      setSummary(result.summary || null)
      setStatistics(result.statistics || null)
      
      // Switch to visualize tab after successful upload
      setActiveTab('visualize')
    } catch (err) {
      console.error('Error uploading file:', err)
      setError('Failed to process the file. Please try again.')
      setData(null)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }
  
  // Handle visualization request from the chat
  const handleVisualizationRequest = (type: string, config: any) => {
    setSelectedVisualization({ type, config });
    setActiveTab('visualize'); // Switch to visualization tab
  };

  return (
    <main className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tighter text-slate-900 sm:text-4xl md:text-5xl">
          AI-Powered Business Insights
        </h1>
        <p className="max-w-[600px] text-center text-slate-700">
          Upload your business data to generate AI-powered visualizations and insights.
        </p>
      </div>

      <div className="w-full">
        <header className="py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
        </header>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="visualize" disabled={!data}>Visualize</TabsTrigger>
            <TabsTrigger value="chat" disabled={!data}>Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-slate-200 card-hover">
              <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
                <span className="inline-block w-8 h-8 mr-2 rounded-full gradient-primary flex items-center justify-center text-white">
                  1
                </span>
                Upload Your Data
              </h2>
              <FileUpload onUpload={handleFileUpload} />
            </div>
          </TabsContent>
          <TabsContent value="visualize">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  {data && (
                    <DataVisualizer 
                      data={data} 
                      statistics={statistics || {}} 
                      selectedVisualization={selectedVisualization} 
                    />
                  )}
                </div>
                <div>
                  <InsightsSummary 
                    summary={summary || undefined} 
                    data={data || []} 
                    statistics={statistics || {}} 
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="chat">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  {data && (
                    <DataChat 
                      data={data} 
                      statistics={statistics || {}} 
                      onVisualizationRequest={handleVisualizationRequest}
                    />
                  )}
                </div>
                <div>
                  <InsightsSummary 
                    summary={summary || undefined} 
                    data={data || []} 
                    statistics={statistics || {}} 
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {loading && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full">
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Processing your data</p>
                  <p className="text-sm text-slate-500">This may take a moment...</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <footer className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            AI-Powered Insights • Developed with Next.js and OpenAI
          </p>
        </footer>
      </div>
    </main>
  )
}
