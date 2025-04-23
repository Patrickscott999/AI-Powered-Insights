'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { FileUpload } from '@/components/file-upload';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process file');
      }
      
      const result = await response.json();
      
      // Store the results in localStorage for the visualization page
      localStorage.setItem('uploadedData', JSON.stringify(result.data || []));
      localStorage.setItem('dataStatistics', JSON.stringify(result.statistics || {}));
      localStorage.setItem('dataSummary', result.summary || '');
      
      // Navigate to the visualization page
      router.push('/visualize');
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to process the file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">AI-Powered Business Analytics</h1>
          <Link href="/" className="px-4 py-2 text-slate-600 rounded-lg font-medium flex items-center hover:bg-slate-100 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Upload Your Business Data</h2>
            <p className="text-lg text-slate-600">
              Upload your CSV data file to get started with AI-powered business analysis.
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}
          
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm mb-10">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Processing your data</h3>
                <p className="text-slate-500">This may take a moment...</p>
              </div>
            ) : (
              <FileUpload onUpload={handleFileUpload} />
            )}
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-xl font-bold text-slate-900 mb-3">What happens after you upload?</h3>
            <p className="text-slate-700 mb-4">
              Our AI will automatically analyze your data and provide:
            </p>
            <div className="grid gap-4">
              <div className="flex items-start">
                <div className="bg-white p-2 rounded-full mr-3">
                  <span className="flex items-center justify-center h-5 w-5 text-white bg-indigo-600 rounded-full text-xs font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Interactive Visualizations</h4>
                  <p className="text-sm text-slate-600">Automatically generated charts and graphs to visualize key insights</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white p-2 rounded-full mr-3">
                  <span className="flex items-center justify-center h-5 w-5 text-white bg-indigo-600 rounded-full text-xs font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Business Intelligence Chat</h4>
                  <p className="text-sm text-slate-600">Ask questions about your data and get AI-powered business insights</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white p-2 rounded-full mr-3">
                  <span className="flex items-center justify-center h-5 w-5 text-white bg-indigo-600 rounded-full text-xs font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">Strategic Recommendations</h4>
                  <p className="text-sm text-slate-600">Actionable business suggestions tailored to your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-slate-50 border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>AI-Powered Business Analytics • Transforming Data into Actionable Insights</p>
        </div>
      </footer>
    </div>
  );
} 