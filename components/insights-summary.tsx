"use client"

import { useEffect, useState } from "react"

interface InsightsSummaryProps {
  summary: string
}

export function InsightsSummary({ summary }: InsightsSummaryProps) {
  const [points, setPoints] = useState<string[]>([])
  const [sections, setSections] = useState<{title: string, points: string[]}[]>([])

  useEffect(() => {
    // Split the summary into bullet points for better readability
    const processedSummary = summary
      .split('\n')
      .filter(line => line.trim() !== '')
    
    setPoints(processedSummary)
    
    // Group insights into sections for better organization
    let currentSection: {title: string, points: string[]} = {title: "General Insights", points: []}
    const groupedSections: {title: string, points: string[]}[] = []
    
    processedSummary.forEach(point => {
      // Check if it's a heading
      if (point.includes("Analysis:") || 
          point.trim().endsWith("Analysis:") || 
          point.includes("statistics:") ||
          point.includes("Pattern Analysis") ||
          point.includes("Forecast Analysis") ||
          point.includes("Segmentation")) {
        
        // Save previous section if it has points
        if (currentSection.points.length > 0) {
          groupedSections.push({...currentSection})
        }
        
        // Start a new section
        currentSection = {
          title: point.trim(),
          points: []
        }
      } else if (point.startsWith('-') || point.startsWith('•')) {
        // Add bullet points to current section
        currentSection.points.push(point)
      } else if (!point.includes("Column '") && point.trim() !== '') {
        // Add other non-heading text as points
        currentSection.points.push(point)
      }
    })
    
    // Add the last section
    if (currentSection.points.length > 0) {
      groupedSections.push(currentSection)
    }
    
    setSections(groupedSections)
  }, [summary])

  return (
    <div className="prose prose-slate max-w-none">
      {sections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, sectionIndex) => (
            <div 
              key={sectionIndex} 
              className="bg-white rounded-lg shadow-sm p-5 border border-slate-100 card-hover"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
              </div>
              
              <div className="space-y-3">
                {section.points.map((point, index) => {
                  // Check if it's a data point (starts with "-")
                  if (point.startsWith('-') || point.startsWith('•')) {
                    const cleanPoint = point.substring(1).trim()
                    return (
                      <div key={index} className="flex items-start group">
                        <div className="mr-2 mt-1 flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full p-1 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-slate-700 text-sm group-hover:text-slate-900 transition-colors">{cleanPoint}</p>
                      </div>
                    )
                  }
                  
                  // Otherwise it's a normal paragraph
                  return <p key={index} className="text-slate-700 text-sm pl-7">{point}</p>
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-10 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="italic text-slate-500">No insights available.</p>
        </div>
      )}
    </div>
  )
}
