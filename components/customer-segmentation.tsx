"use client"

import { useState } from "react"
import { 
  PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts"

interface CustomerSegmentationProps {
  segmentationData: any
}

const SEGMENT_COLORS = {
  'Champions': '#0088FE',
  'Loyal': '#00C49F',
  'Potential': '#FFBB28',
  'New': '#FF8042',
  'At Risk': '#FF0000',
  'Others': '#AAAAAA'
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CustomerSegmentation({ segmentationData }: CustomerSegmentationProps) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null)
  
  // Handle case where no segmentation data is available
  if (!segmentationData || !segmentationData.segments || Object.keys(segmentationData.segments).length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-medium text-slate-700 mb-4">Customer Segmentation</h3>
        <div className="h-[400px] flex items-center justify-center bg-gray-50 border border-gray-100 rounded">
          <p className="text-gray-500">No customer segmentation data available</p>
        </div>
      </div>
    )
  }
  
  // Prepare data for the pie chart
  const pieData = Object.entries(segmentationData.segments).map(([name, value]) => ({
    name,
    value: typeof value === 'number' ? value : 0
  }))
  
  // Prepare data for the bar chart (segment stats)
  const segmentStats = segmentationData.segment_stats || {}
  const recencyStats = segmentStats.recency || {}
  const frequencyStats = segmentStats.frequency || {}
  
  const barData = Object.keys(segmentationData.segments).map(segment => ({
    name: segment,
    recency: recencyStats[segment] ? Math.round(recencyStats[segment]) : 0,
    frequency: frequencyStats[segment] ? Math.round(frequencyStats[segment]) : 0
  }))
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-slate-700">Customer Segmentation</h3>
        <div className="text-sm text-gray-500">
          RFM Analysis (Recency, Frequency, Monetary)
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-2">Customer Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={(data) => setActiveSegment(data.name)}
                onMouseLeave={() => setActiveSegment(null)}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={SEGMENT_COLORS[entry.name as keyof typeof SEGMENT_COLORS] || '#AAAAAA'} 
                    opacity={activeSegment === null || activeSegment === entry.name ? 1 : 0.6}
                    stroke="#fff"
                    strokeWidth={activeSegment === entry.name ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} customers`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-2">Segment Characteristics</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="recency" name="Recency (days)" fill="#8884d8" />
              <Bar dataKey="frequency" name="Frequency (items)" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="mt-6">
        <h4 className="text-lg font-medium text-gray-700 mb-4">Segment Descriptions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h5 className="font-medium text-blue-800 mb-1">Champions</h5>
            <p className="text-sm text-blue-700">
              Bought recently, buy often and spend the most. Highly engaged customers.
            </p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h5 className="font-medium text-green-800 mb-1">Loyal</h5>
            <p className="text-sm text-green-700">
              Buy regularly but not as often as Champions. Good retention metrics.
            </p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <h5 className="font-medium text-yellow-800 mb-1">Potential</h5>
            <p className="text-sm text-yellow-700">
              Recent customers with average frequency. High growth potential.
            </p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <h5 className="font-medium text-orange-800 mb-1">New</h5>
            <p className="text-sm text-orange-700">
              Recent first-time buyers. Need nurturing to become regular customers.
            </p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h5 className="font-medium text-red-800 mb-1">At Risk</h5>
            <p className="text-sm text-red-700">
              Purchased often but haven't returned in a while. Churn risk.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h5 className="font-medium text-gray-800 mb-1">Others</h5>
            <p className="text-sm text-gray-700">
              Customers who don't fit into the standard segments.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 