"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PredictiveForecast } from "@/components/predictive-forecast"
import { CustomerSegmentation } from "@/components/customer-segmentation"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface DataVisualizerProps {
  data: any[]
  statistics?: any
}

type ChartType = "bar" | "line" | "pie" | "heatmap"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export function DataVisualizer({ data, statistics }: DataVisualizerProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>("")
  const [chartType, setChartType] = useState<ChartType>("bar")
  const [aggregatedData, setAggregatedData] = useState<any[]>([])
  const [numericColumns, setNumericColumns] = useState<string[]>([])
  const [categoricalColumns, setCategoricalColumns] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("standard")
  
  // Time series data states
  const [timeSeriesData, setTimeSeriesData] = useState<any>({})
  const [timeMetric, setTimeMetric] = useState<string>("hourly")
  
  // Association analysis states
  const [associationData, setAssociationData] = useState<any>({})
  const [selectedItem, setSelectedItem] = useState<string>("")
  
  // Correlation matrix states
  const [correlationData, setCorrelationData] = useState<any>({})
  const [maxCorrelation, setMaxCorrelation] = useState<number>(1)

  // Initialize selected column and identify data types
  useEffect(() => {
    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      
      // Separate numeric and categorical columns
      const numeric: string[] = []
      const categorical: string[] = []
      
      columns.forEach(col => {
        // Check if the column contains numeric values
        if (!isNaN(Number(data[0][col]))) {
          numeric.push(col)
        } else {
          categorical.push(col)
        }
      })
      
      setNumericColumns(numeric)
      setCategoricalColumns(categorical)
      
      // Set default selected column (prefer numeric)
      if (numeric.length > 0) {
        setSelectedColumn(numeric[0])
      } else if (categorical.length > 0) {
        setSelectedColumn(categorical[0])
      }
    }
  }, [data])
  
  // Process time series data from statistics
  useEffect(() => {
    if (statistics?.time_patterns) {
      setTimeSeriesData(statistics.time_patterns)
      if (statistics.time_patterns.hourly) {
        setTimeMetric("hourly")
      } else if (statistics.time_patterns.daily) {
        setTimeMetric("daily")
      }
    }
  }, [statistics])
  
  // Process association data
  useEffect(() => {
    if (statistics?.product_associations) {
      setAssociationData(statistics.product_associations)
      const items = Object.keys(statistics.product_associations)
      if (items.length > 0) {
        setSelectedItem(items[0])
      }
    }
  }, [statistics])
  
  // Process correlation matrix
  useEffect(() => {
    if (statistics?.categorical_correlation) {
      setCorrelationData(statistics.categorical_correlation)
      
      // Find max correlation value (except self-correlations of 1.0)
      let max = 0
      const matrix = statistics.categorical_correlation
      Object.keys(matrix).forEach(col1 => {
        Object.keys(matrix[col1]).forEach(col2 => {
          if (col1 !== col2 && matrix[col1][col2] > max) {
            max = matrix[col1][col2]
          }
        })
      })
      setMaxCorrelation(max)
    }
  }, [statistics])

  // Prepare data for visualization when selectedColumn changes
  useEffect(() => {
    if (!selectedColumn) return
    
    // For categorical columns, count occurrences for pie/bar charts
    if (categoricalColumns.includes(selectedColumn)) {
      const counts: Record<string, number> = {}
      
      data.forEach(item => {
        const value = item[selectedColumn]
        counts[value] = (counts[value] || 0) + 1
      })
      
      const aggregated = Object.entries(counts).map(([name, value]) => ({
        name,
        value
      }))
      
      // Sort by value in descending order
      aggregated.sort((a, b) => b.value - a.value)
      
      // Limit to top 10 categories for better visualization
      setAggregatedData(aggregated.slice(0, 10))
    } else {
      // For numeric data, use the raw data
      setAggregatedData(data)
    }
  }, [selectedColumn, data, categoricalColumns])

  const toggleChartType = () => {
    if (chartType === "bar") setChartType("line")
    else if (chartType === "line") setChartType("pie") 
    else setChartType("bar")
  }

  // Check if the selected column is categorical
  const isCategorical = categoricalColumns.includes(selectedColumn)

  // Determine if pie chart is appropriate (only for categorical data)
  const showPieOption = isCategorical
  
  // Prepare time series data for visualization
  const prepareTimeSeriesData = () => {
    if (!timeSeriesData || !timeMetric || !timeSeriesData[timeMetric]) {
      return []
    }
    
    const data = timeSeriesData[timeMetric]
    return Object.entries(data).map(([key, value]) => ({
      name: key,
      count: value
    }))
  }
  
  // Format time series x-axis labels
  const formatTimeLabel = (value: string) => {
    if (timeMetric === "hourly") {
      return `${value}:00`
    }
    return value
  }
  
  // Prepare association data for visualization
  const prepareAssociationData = () => {
    if (!associationData || !selectedItem || !associationData[selectedItem]) {
      return []
    }
    
    return associationData[selectedItem].map(([item, count]: [string, number]) => ({
      name: item,
      value: count
    }))
  }
  
  // Prepare correlation matrix data for recharts
  const prepareCorrelationData = () => {
    if (!correlationData || Object.keys(correlationData).length === 0) {
      return []
    }
    
    const result: Array<{x: string, y: string, z: number, value: number}> = []
    const columns = Object.keys(correlationData)
    
    columns.forEach(col1 => {
      columns.forEach(col2 => {
        if (col1 <= col2) { // Only show half of the matrix to avoid duplicates
          result.push({
            x: col1,
            y: col2,
            z: correlationData[col1][col2] * 100, // Scale up for better visibility
            value: correlationData[col1][col2]
          })
        }
      })
    })
    
    return result
  }
  
  // Color scale for correlation heatmap
  const getCorrelationColor = (value: number) => {
    if (value >= 0.8) return "#ff0000"
    if (value >= 0.6) return "#ff6666"
    if (value >= 0.4) return "#ffcccc"
    if (value >= 0.2) return "#ffffcc"
    return "#ccffcc"
  }
  
  // Custom tooltip for correlation matrix
  const CorrelationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-2 border border-gray-200 shadow-sm rounded-md">
          <p className="font-medium">{`${data.x} vs ${data.y}`}</p>
          <p className="text-gray-700">{`Correlation: ${data.value.toFixed(3)}`}</p>
        </div>
      )
    }
    return null
  }

  // Render the appropriate chart based on type and data
  const renderChart = () => {
    if (!selectedColumn || aggregatedData.length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          Select a column to visualize
        </div>
      )
    }

    // For categorical data with pie chart
    if (chartType === "pie" && isCategorical) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={aggregatedData}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {aggregatedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    // For categorical data with bar chart
    if (isCategorical) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={aggregatedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Count" />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    // For numeric data with line or bar chart
    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={numericColumns[0] !== selectedColumn ? numericColumns[0] : "index"} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={selectedColumn} stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={numericColumns[0] !== selectedColumn ? numericColumns[0] : "index"} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={selectedColumn} fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    )
  }
  
  // Render time series visualization
  const renderTimeSeries = () => {
    const timeData = prepareTimeSeriesData()
    
    if (!timeData || timeData.length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          No time series data available
        </div>
      )
    }
    
    return (
      <div>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <Select onValueChange={setTimeMetric} value={timeMetric}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(timeSeriesData).map((period) => (
                  <SelectItem key={period} value={period}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={timeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickFormatter={formatTimeLabel} />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`${value} transactions`, 'Count']}
              labelFormatter={formatTimeLabel}
            />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }
  
  // Render product association visualization
  const renderAssociations = () => {
    if (!associationData || Object.keys(associationData).length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          No product association data available
        </div>
      )
    }
    
    const associationItems = Object.keys(associationData)
    const associatedProducts = prepareAssociationData()
    
    return (
      <div>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <Select onValueChange={setSelectedItem} value={selectedItem}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {associationItems.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="text-xl font-medium">Items frequently bought with "{selectedItem}"</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={associatedProducts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip 
              formatter={(value) => [`${value} times`, 'Purchased together']}
            />
            <Bar dataKey="value" fill="#00C49F" name="Purchased together" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }
  
  // Render correlation matrix visualization
  const renderCorrelationMatrix = () => {
    if (!correlationData || Object.keys(correlationData).length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          No correlation data available
        </div>
      )
    }
    
    const correlationItems = prepareCorrelationData()
    
    return (
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-medium">Categorical Correlation Matrix</h3>
          <p className="text-sm text-gray-500">Cramer's V values: 0 (no association) to 1 (perfect association)</p>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="category" 
              name="Category 1" 
              allowDuplicatedCategory={false} 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis dataKey="y" type="category" name="Category 2" allowDuplicatedCategory={false} width={80} />
            <ZAxis dataKey="z" range={[50, 800]} />
            <Tooltip content={<CorrelationTooltip />} />
            <Scatter 
              data={correlationItems} 
              fill="#8884d8"
              shape="circle"
            >
              {correlationItems.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getCorrelationColor(entry.value)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200"></div>
            <span className="text-xs">Low</span>
            <div className="w-4 h-4 bg-yellow-200"></div>
            <div className="w-4 h-4 bg-red-200"></div>
            <div className="w-4 h-4 bg-red-500"></div>
            <span className="text-xs">High</span>
          </div>
        </div>
      </div>
    )
  }
  
  // Show anomaly information if available
  const renderAnomalies = () => {
    if (!statistics?.anomalies || Object.keys(statistics.anomalies).length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center text-gray-500">
          No anomalies detected in the data
        </div>
      )
    }
    
    const { anomalies } = statistics
    
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-medium">Detected Anomalies</h3>
        
        {anomalies.large_transactions && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <h4 className="font-medium text-red-800 mb-2">Unusual Transaction Sizes</h4>
            <p className="text-sm text-red-700 mb-2">{anomalies.large_transactions.description}</p>
            <div className="max-h-[200px] overflow-y-auto bg-white p-2 rounded border border-red-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-1 px-2 bg-red-50">Transaction</th>
                    <th className="text-left py-1 px-2 bg-red-50">Items Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(anomalies.large_transactions.transactions).slice(0, 10).map(([transaction, count], idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-red-50' : 'bg-white'}>
                      <td className="py-1 px-2">{transaction}</td>
                      <td className="py-1 px-2">{String(count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {anomalies.rare_items && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <h4 className="font-medium text-yellow-800 mb-2">Rare Items</h4>
            <p className="text-sm text-yellow-700 mb-2">{anomalies.rare_items.description}</p>
            <div className="flex flex-wrap gap-2">
              {anomalies.rare_items.items.map((item: string, idx: number) => (
                <span key={idx} className="bg-white px-2 py-1 rounded text-xs border border-yellow-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {anomalies.unusual_hours && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Unusual Business Hours</h4>
            <p className="text-sm text-blue-700 mb-2">{anomalies.unusual_hours.description}</p>
            <div className="max-h-[200px] overflow-y-auto bg-white p-2 rounded border border-blue-100">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-1 px-2 bg-blue-50">Hour</th>
                    <th className="text-left py-1 px-2 bg-blue-50">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(anomalies.unusual_hours.counts).map(([hour, count], idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                      <td className="py-1 px-2">{hour}:00</td>
                      <td className="py-1 px-2">{String(count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 mb-6">
          <TabsTrigger value="standard">Standard</TabsTrigger>
          <TabsTrigger value="time">Time Series</TabsTrigger>
          <TabsTrigger value="associations">Associations</TabsTrigger>
          <TabsTrigger value="correlation">Correlation</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="standard" className="mt-0">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Column to Visualize</label>
              <Select onValueChange={setSelectedColumn} value={selectedColumn}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {numericColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column} (Number)
                    </SelectItem>
                  ))}
                  {categoricalColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column} (Category)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
              <div className="flex space-x-2">
                <Button 
                  variant={chartType === "bar" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartType("bar")}
                >
                  Bar
                </Button>
                <Button 
                  variant={chartType === "line" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setChartType("line")}
                >
                  Line
                </Button>
                {showPieOption && (
                  <Button 
                    variant={chartType === "pie" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartType("pie")}
                  >
                    Pie
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            {renderChart()}
          </div>
          
          {selectedColumn && (
            <div className="mt-4 text-sm text-gray-500">
              {isCategorical ? 
                `Showing distribution of ${aggregatedData.length} categories out of ${Object.keys(
                  data.reduce((acc, item) => ({...acc, [item[selectedColumn]]: true}), {})
                ).length} total categories.` :
                `Showing numeric data for column "${selectedColumn}" across ${data.length} rows.`
              }
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="time" className="mt-0">
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            {renderTimeSeries()}
          </div>
        </TabsContent>
        
        <TabsContent value="associations" className="mt-0">
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            {renderAssociations()}
          </div>
        </TabsContent>
        
        <TabsContent value="correlation" className="mt-0">
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            {renderCorrelationMatrix()}
          </div>
        </TabsContent>
        
        <TabsContent value="anomalies" className="mt-0">
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4">
            {renderAnomalies()}
          </div>
        </TabsContent>
        
        <TabsContent value="forecast" className="mt-0">
          <PredictiveForecast forecastData={statistics?.forecast || {}} />
        </TabsContent>
        
        <TabsContent value="segments" className="mt-0">
          <CustomerSegmentation segmentationData={statistics?.customer_segments || {}} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
