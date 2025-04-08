"use client"

import { useState } from "react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart 
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PredictiveForecastProps {
  forecastData: any
}

export function PredictiveForecast({ forecastData }: PredictiveForecastProps) {
  const [chartType, setChartType] = useState<"area" | "line">("area")
  
  // Handle case where no forecast data is available
  if (!forecastData || !forecastData.dates || forecastData.dates.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-medium text-slate-700 mb-4">Sales Forecast</h3>
        <div className="h-[400px] flex items-center justify-center bg-gray-50 border border-gray-100 rounded">
          <p className="text-gray-500">No forecast data available</p>
        </div>
      </div>
    )
  }
  
  // Combine dates, predictions, and bounds into a format for recharts
  const combinedData = forecastData.dates.map((date: string, i: number) => ({
    date,
    predicted: forecastData.predicted[i],
    lower: forecastData.lower_bound[i],
    upper: forecastData.upper_bound[i]
  }))
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-slate-700">Sales Forecast</h3>
        <div className="text-sm text-gray-500">
          Next {forecastData.dates.length} days projection
        </div>
      </div>
      
      <Tabs value={chartType} onValueChange={(v) => setChartType(v as "area" | "line")}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="area">Area Chart</TabsTrigger>
            <TabsTrigger value="line">Line Chart</TabsTrigger>
          </TabsList>
          
          <div className="text-xs text-gray-500">
            Forecast generated using time series analysis
          </div>
        </div>
        
        <TabsContent value="area">
          <div className="bg-white border-gray-100 rounded-lg">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3} 
                  name="Predicted Sales"
                />
                <Area 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.1} 
                  strokeDasharray="5 5"
                  name="Upper Bound"
                />
                <Area 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  fillOpacity={0.1} 
                  strokeDasharray="5 5"
                  name="Lower Bound"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
        
        <TabsContent value="line">
          <div className="bg-white border-gray-100 rounded-lg">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Predicted Sales"
                />
                <Line 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="#82ca9d" 
                  strokeDasharray="5 5"
                  name="Upper Bound"
                />
                <Line 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="#ffc658" 
                  strokeDasharray="5 5"
                  name="Lower Bound"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h4 className="font-medium text-purple-800 mb-1">Trend Analysis</h4>
          <p className="text-sm text-purple-700">
            {forecastData.trend > 0 
              ? `${forecastData.trend.toFixed(1)}% upward trend expected` 
              : forecastData.trend < 0 
                ? `${Math.abs(forecastData.trend).toFixed(1)}% downward trend expected`
                : "No significant trend detected"}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <h4 className="font-medium text-green-800 mb-1">Seasonal Pattern</h4>
          <p className="text-sm text-green-700">
            {forecastData.seasonal_periods 
              ? `${forecastData.seasonal_periods} pattern detected` 
              : "No seasonal pattern detected"}
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-medium text-blue-800 mb-1">Peak Day</h4>
          <p className="text-sm text-blue-700">
            {forecastData.peak_forecast_day 
              ? `Peak sales expected on ${forecastData.peak_forecast_day}` 
              : "No clear peak day"}
          </p>
        </div>
      </div>
    </div>
  )
} 