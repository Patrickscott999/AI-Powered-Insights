"use client"

import { useMemo } from 'react'

interface DataQualityProps {
  quality: {
    overall_score: number;
    rating: string;
    column_issues: Record<string, string[]>;
    missing_values: Record<string, { count: number, percentage: number }>;
    recommendations: string[];
  } | null;
  totalRows: number;
}

export function DataQuality({ quality, totalRows }: DataQualityProps) {
  const scoreColor = useMemo(() => {
    if (!quality) return 'bg-gray-200';
    if (quality.overall_score >= 90) return 'bg-green-500';
    if (quality.overall_score >= 75) return 'bg-green-400';
    if (quality.overall_score >= 60) return 'bg-yellow-400';
    if (quality.overall_score >= 40) return 'bg-orange-400';
    return 'bg-red-500';
  }, [quality]);

  const scoreTextColor = useMemo(() => {
    if (!quality) return 'text-gray-500';
    if (quality.overall_score >= 60) return 'text-green-700';
    if (quality.overall_score >= 40) return 'text-yellow-700';
    return 'text-red-700';
  }, [quality]);

  if (!quality) {
    return <div className="text-center py-8 text-gray-400">No data quality information available.</div>;
  }

  const issueCount = Object.keys(quality.column_issues).length;
  const columnsWithMissingValues = Object.keys(quality.missing_values).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">Data Quality Assessment</h3>
          <p className="text-sm text-gray-500">
            Based on analysis of {totalRows} rows
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full bg-gray-200"></div>
              <div 
                className={`absolute inset-0 rounded-full ${scoreColor} shadow-sm`} 
                style={{ 
                  clipPath: `polygon(0 0, 100% 0, 100% 100%, 0% 100%)`,
                  opacity: quality.overall_score / 100 
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${scoreTextColor}`}>{quality.overall_score}</span>
              </div>
            </div>
            <div className="ml-2">
              <div className={`text-sm font-medium ${scoreTextColor}`}>{quality.rating}</div>
              <div className="text-xs text-gray-500">Quality Score</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <h4 className="font-medium text-gray-700 mb-2">Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-500 uppercase font-medium">Columns Analyzed</div>
            <div className="text-2xl font-bold text-blue-700">
              {Object.keys(quality.missing_values).length + 
                Object.keys(quality.column_issues).filter(col => !quality.missing_values[col]).length}
            </div>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="text-xs text-amber-500 uppercase font-medium">Columns with Issues</div>
            <div className="text-2xl font-bold text-amber-700">
              {issueCount}
            </div>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg">
            <div className="text-xs text-indigo-500 uppercase font-medium">Missing Values</div>
            <div className="text-2xl font-bold text-indigo-700">
              {columnsWithMissingValues > 0 ? 
                `${columnsWithMissingValues} columns` : 
                'None detected'}
            </div>
          </div>
        </div>
      </div>

      {quality.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h4 className="font-medium text-gray-700 mb-2">Recommendations</h4>
          <ul className="space-y-2">
            {quality.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mt-0.5 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(quality.column_issues).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <h4 className="font-medium text-gray-700 mb-2">Column Issues</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issues</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(quality.column_issues).map(([column, issues], index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-700">{column}</td>
                    <td className="px-4 py-2">
                      <ul className="list-disc list-inside space-y-1">
                        {Array.isArray(issues) && issues.map((issue, issueIndex) => (
                          <li key={issueIndex} className="text-sm text-gray-600">{issue}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        Data quality assessment helps you understand the reliability of your insights. 
        Address identified issues to improve analysis accuracy.
      </div>
    </div>
  );
} 