'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';
import { DataVisualizer } from '@/components/data-visualizer';
import { InsightsSummary } from '@/components/insights-summary';
import { DataStrategies } from '@/components/data-strategies';
import { DataChat } from '@/components/data-chat';

export default function VisualizePage() {
  const [data, setData] = useState<any[] | null>(null);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("visualize");
  const [selectedVisualization, setSelectedVisualization] = useState({ type: '', config: {}});

  useEffect(() => {
    // Get the data from localStorage
    const storedData = localStorage.getItem('uploadedData');
    const storedStatistics = localStorage.getItem('dataStatistics');
    const storedSummary = localStorage.getItem('dataSummary');
    
    if (storedData) {
      try {
        setData(JSON.parse(storedData));
      } catch (e) {
        console.error('Failed to parse stored data', e);
      }
    }
    
    if (storedStatistics) {
      try {
        setStatistics(JSON.parse(storedStatistics));
      } catch (e) {
        console.error('Failed to parse stored statistics', e);
      }
    }
    
    if (storedSummary) {
      setSummary(storedSummary);
    }
  }, []);

  // Handle visualization request from the chat
  const handleVisualizationRequest = (type: string, config: any) => {
    setSelectedVisualization({ type, config });
    setActiveTab('visualize');
  };
  
  // Handle predictive forecast request
  const handleShowPrediction = () => {
    setSelectedVisualization({ 
      type: 'forecast', 
      config: { active: 'forecast' } 
    });
    setActiveTab('visualize');
  };
  
  // Handle what-if scenario request
  const handleShowScenario = (scenarioName: string) => {
    setSelectedVisualization({ 
      type: 'forecast', 
      config: { 
        active: 'scenario',
        scenarioName: scenarioName 
      } 
    });
    setActiveTab('visualize');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">AI-Powered Business Analytics</h1>
          <Link href="/upload" className="px-4 py-2 text-slate-600 rounded-lg font-medium flex items-center hover:bg-slate-100 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Upload New Data
          </Link>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {data ? (
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="visualize">Visualize Data</TabsTrigger>
                <TabsTrigger value="chat">Business Analyst Chat</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visualize" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <DataVisualizer 
                      data={data} 
                      statistics={statistics || {}} 
                      selectedVisualization={selectedVisualization} 
                    />
                  </div>
                  <div className="space-y-6">
                    <InsightsSummary 
                      summary={summary || undefined} 
                      data={data || []} 
                      statistics={statistics || {}} 
                    />
                    <DataStrategies
                      data={data || []}
                      statistics={statistics || {}}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="chat" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <DataChat 
                      data={data} 
                      statistics={statistics || {}} 
                      onVisualizeData={handleVisualizationRequest}
                      onShowPrediction={handleShowPrediction}
                      onShowScenario={handleShowScenario}
                    />
                  </div>
                  <div className="space-y-6">
                    <InsightsSummary 
                      summary={summary || undefined} 
                      data={data || []} 
                      statistics={statistics || {}} 
                    />
                    <DataStrategies
                      data={data || []}
                      statistics={statistics || {}}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Data Available</h2>
            <p className="text-slate-600 mb-6">
              You need to upload a CSV file to analyze.
            </p>
            <Link href="/upload" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium inline-flex items-center hover:bg-indigo-700 transition-colors">
              Go to Upload <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
            </Link>
          </div>
        )}
      </main>
      
      <footer className="bg-slate-50 border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>AI-Powered Business Analytics • Transforming Data into Actionable Insights</p>
        </div>
      </footer>
    </div>
  );
} 