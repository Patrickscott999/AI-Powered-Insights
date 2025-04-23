"use client"

import Link from 'next/link'
import { ArrowRight, DollarSign, Package, TrendingUp, Users } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">AI-Powered Business Analytics</h1>
          <Link href="/upload" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center hover:bg-indigo-700 transition-colors">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Transform Your Data into Strategic Business Insights</h2>
            <p className="text-lg text-slate-600">
              Upload your business data and leverage AI-powered analysis to unlock actionable insights, optimize performance, and increase revenue.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <DollarSign className="h-10 w-10 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Revenue Optimization</h3>
              <p className="text-slate-600">
                Identify your highest-performing segments, uncover pricing optimization opportunities, and discover strategies to increase average transaction value.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <Users className="h-10 w-10 text-violet-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Customer Segmentation</h3>
              <p className="text-slate-600">
                Understand your customer base through automatic segmentation, pinpoint high-value customer groups, and develop targeted retention strategies.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <Package className="h-10 w-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Product Mix Analysis</h3>
              <p className="text-slate-600">
                Optimize your product portfolio, identify cross-selling opportunities, and determine which products drive the most value for your business.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <TrendingUp className="h-10 w-10 text-amber-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Performance Forecasting</h3>
              <p className="text-slate-600">
                Predict future business trends, model different scenarios, and make data-driven decisions with AI-powered forecasting.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <Link href="/upload" className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium text-lg hover:bg-indigo-700 transition-colors inline-flex items-center">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <p className="mt-4 text-slate-600">
              No coding or data science expertise required. Simply upload your CSV data and start exploring.
            </p>
          </div>
        </div>
      </main>
      
      <footer className="bg-slate-50 border-t border-slate-200 py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>AI-Powered Business Analytics • Transforming Data into Actionable Insights</p>
        </div>
      </footer>
    </div>
  )
}
