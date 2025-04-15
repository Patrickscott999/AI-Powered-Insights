"use client"

import { useState, useEffect } from "react"
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  BadgeDelta, 
  Card, 
  DeltaType, 
  Flex, 
  Grid, 
  Metric, 
  Text
} from "@tremor/react"
import { Sparkles } from "lucide-react"

interface WhatIfScenarioProps {
  forecastData: any
  metrics?: {
    name: string
    value: number
    type: "percentage" | "number" | "currency"
    min?: number
    max?: number
    step?: number
  }[]
}

interface ScenarioMetric {
  name: string
  value: number
  type: "percentage" | "number" | "currency"
  min?: number
  max?: number
  step?: number
}

export function WhatIfScenario({ forecastData, metrics = [] }: WhatIfScenarioProps) {
  // Default scenarios if none are provided
  const defaultMetrics: ScenarioMetric[] = [
    {
      name: "Price Increase",
      value: 0,
      type: "percentage",
      min: -20,
      max: 50,
      step: 1
    },
    {
      name: "Marketing Budget",
      value: 0,
      type: "percentage",
      min: -50,
      max: 100,
      step: 5
    },
    {
      name: "Discount Level",
      value: 0,
      type: "percentage",
      min: 0,
      max: 30,
      step: 1
    }
  ]

  const [activeScenario, setActiveScenario] = useState<string>("custom")
  const [scenarioMetrics, setScenarioMetrics] = useState<ScenarioMetric[]>(
    metrics.length > 0 ? metrics as ScenarioMetric[] : defaultMetrics
  )
  const [modifiedForecast, setModifiedForecast] = useState<any>(null)
  const [impact, setImpact] = useState({
    revenue: 0,
    growth: 0,
    confidence: "medium" as "high" | "medium" | "low"
  })
  
  // Calculate impact of changes on forecast
  useEffect(() => {
    if (!forecastData || !forecastData.predicted) return
    
    // Get the total sum of the original forecast
    const originalTotal = forecastData.predicted.reduce((sum: number, val: number) => sum + val, 0)
    
    // Calculate modifiers based on scenario settings
    let revenueMultiplier = 1.0
    let volumeMultiplier = 1.0
    
    // Apply price changes (affects revenue but may reduce volume)
    const priceChange = scenarioMetrics.find(m => m.name === "Price Increase")?.value || 0
    if (priceChange !== 0) {
      revenueMultiplier *= (1 + priceChange / 100)
      // Price elasticity: higher prices tend to reduce volume
      volumeMultiplier *= Math.max(0.7, 1 - (priceChange / 100) * 0.5)
    }
    
    // Apply marketing changes (affects volume)
    const marketingChange = scenarioMetrics.find(m => m.name === "Marketing Budget")?.value || 0
    if (marketingChange !== 0) {
      // Marketing has diminishing returns
      volumeMultiplier *= (1 + (marketingChange > 0 
        ? Math.log1p(marketingChange) / 10 
        : marketingChange / 100))
    }
    
    // Apply discount changes (affects volume but reduces revenue)
    const discountChange = scenarioMetrics.find(m => m.name === "Discount Level")?.value || 0
    if (discountChange !== 0) {
      revenueMultiplier *= (1 - discountChange / 100)
      // Discounts tend to increase volume
      volumeMultiplier *= (1 + discountChange / 100 * 0.8)
    }
    
    // Calculate final multiplier
    const totalMultiplier = revenueMultiplier * volumeMultiplier
    
    // Create modified forecast
    const modified = {
      ...forecastData,
      predicted: forecastData.predicted.map((val: number) => Math.round(val * totalMultiplier)),
      upper_bound: forecastData.upper_bound.map((val: number) => Math.round(val * totalMultiplier * 1.1)),
      lower_bound: forecastData.lower_bound.map((val: number) => Math.round(val * totalMultiplier * 0.9))
    }
    
    setModifiedForecast(modified)
    
    // Calculate the total sum of the modified forecast
    const modifiedTotal = modified.predicted.reduce((sum: number, val: number) => sum + val, 0)
    
    // Calculate percentage change
    const percentChange = ((modifiedTotal - originalTotal) / originalTotal) * 100
    
    // Set impact details
    setImpact({
      revenue: modifiedTotal - originalTotal,
      growth: percentChange,
      confidence: calculateConfidence(scenarioMetrics)
    })
    
  }, [forecastData, scenarioMetrics])
  
  // Helper to determine confidence level based on scenario extremity
  const calculateConfidence = (metrics: ScenarioMetric[]): "high" | "medium" | "low" => {
    const totalChangeMagnitude = metrics.reduce((sum, metric) => {
      const percentOfMax = metric.max ? Math.abs(metric.value) / metric.max * 100 : Math.abs(metric.value)
      return sum + percentOfMax
    }, 0) / metrics.length
    
    if (totalChangeMagnitude < 20) return "high"
    if (totalChangeMagnitude < 50) return "medium"
    return "low"
  }
  
  const handleScenarioChange = (scenario: string) => {
    setActiveScenario(scenario)
    
    // Apply predefined scenarios
    if (scenario === "optimistic") {
      setScenarioMetrics(
        scenarioMetrics.map(metric => {
          if (metric.name === "Price Increase") return { ...metric, value: 5 }
          if (metric.name === "Marketing Budget") return { ...metric, value: 30 }
          if (metric.name === "Discount Level") return { ...metric, value: 0 }
          return metric
        })
      )
    } else if (scenario === "pessimistic") {
      setScenarioMetrics(
        scenarioMetrics.map(metric => {
          if (metric.name === "Price Increase") return { ...metric, value: -5 }
          if (metric.name === "Marketing Budget") return { ...metric, value: -20 }
          if (metric.name === "Discount Level") return { ...metric, value: 15 }
          return metric
        })
      )
    } else if (scenario === "competitive") {
      setScenarioMetrics(
        scenarioMetrics.map(metric => {
          if (metric.name === "Price Increase") return { ...metric, value: -10 }
          if (metric.name === "Marketing Budget") return { ...metric, value: 40 }
          if (metric.name === "Discount Level") return { ...metric, value: 10 }
          return metric
        })
      )
    } else if (scenario === "baseline") {
      setScenarioMetrics(
        scenarioMetrics.map(metric => ({ ...metric, value: 0 }))
      )
    }
  }
  
  const handleMetricChange = (name: string, value: number) => {
    setScenarioMetrics(
      scenarioMetrics.map(metric => 
        metric.name === name ? { ...metric, value } : metric
      )
    )
    
    // When manually changing values, switch to custom scenario
    setActiveScenario("custom")
  }
  
  const formatValue = (value: number, type: string) => {
    if (type === "percentage") return `${value > 0 ? '+' : ''}${value}%`
    if (type === "currency") return `$${value.toLocaleString()}`
    return value.toLocaleString()
  }
  
  const getDeltaType = (value: number): DeltaType => {
    if (value > 0) return "increase"
    if (value < 0) return "decrease"
    return "unchanged"
  }
  
  // Handle case where no forecast data is available
  if (!forecastData || !forecastData.dates || forecastData.dates.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-xl font-medium text-slate-700 mb-4">What-If Scenario Modeling</h3>
        <div className="h-[400px] flex items-center justify-center bg-gray-50 border border-gray-100 rounded">
          <p className="text-gray-500">No forecast data available for scenario modeling</p>
        </div>
      </div>
    )
  }
  
  // Prepare chart data combining original and modified forecasts
  const chartData = forecastData.dates.map((date: string, i: number) => ({
    date,
    original: forecastData.predicted[i],
    modified: modifiedForecast?.predicted[i] || forecastData.predicted[i],
    lower: modifiedForecast?.lower_bound[i] || forecastData.lower_bound[i],
    upper: modifiedForecast?.upper_bound[i] || forecastData.upper_bound[i]
  }))
  
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-slate-700">What-If Scenario Modeling</h3>
        <div className="text-sm text-gray-500 flex items-center gap-1">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Simulate business scenarios
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border-gray-100 rounded-lg mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="original" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  name="Original Forecast"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="modified" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Modified Forecast"
                />
                <Line 
                  type="monotone" 
                  dataKey="upper" 
                  stroke="#22c55e" 
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  name="Upper Bound"
                />
                <Line 
                  type="monotone" 
                  dataKey="lower" 
                  stroke="#ef4444" 
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  name="Lower Bound"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            <Card decoration="top" decorationColor={impact.growth > 0 ? "green" : impact.growth < 0 ? "red" : "gray"}>
              <Flex justifyContent="between" alignItems="center">
                <Text>Revenue Impact</Text>
                <BadgeDelta deltaType={getDeltaType(impact.growth)} />
              </Flex>
              <Metric>{formatValue(impact.revenue, "currency")}</Metric>
              <Text className="text-xs mt-1">Total over forecast period</Text>
            </Card>
            
            <Card decoration="top" decorationColor={impact.growth > 0 ? "green" : impact.growth < 0 ? "red" : "gray"}>
              <Flex justifyContent="between" alignItems="center">
                <Text>Growth Rate</Text>
                <BadgeDelta deltaType={getDeltaType(impact.growth)} />
              </Flex>
              <Metric>{impact.growth > 0 ? '+' : ''}{impact.growth.toFixed(1)}%</Metric>
              <Text className="text-xs mt-1">Compared to baseline</Text>
            </Card>
            
            <Card decoration="top" decorationColor={
              impact.confidence === "high" ? "green" : 
              impact.confidence === "medium" ? "amber" : "red"
            }>
              <Flex justifyContent="between" alignItems="center">
                <Text>Prediction Confidence</Text>
              </Flex>
              <Metric className="capitalize">{impact.confidence}</Metric>
              <Text className="text-xs mt-1">Based on scenario extremity</Text>
            </Card>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <h4 className="font-medium text-slate-800 mb-4">Scenario Settings</h4>
          
          <div className="mb-6">
            <Tabs value={activeScenario} onValueChange={handleScenarioChange}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="baseline">Baseline</TabsTrigger>
                <TabsTrigger value="optimistic">Optimistic</TabsTrigger>
                <TabsTrigger value="pessimistic">Pessimistic</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            {scenarioMetrics.map((metric) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium text-slate-700">{metric.name}</label>
                  <span className="text-sm font-medium text-slate-900">
                    {formatValue(metric.value, metric.type)}
                  </span>
                </div>
                <Slider
                  defaultValue={[metric.value]}
                  min={metric.min || -100}
                  max={metric.max || 100}
                  step={metric.step || 1}
                  onValueChange={(values: number[]) => handleMetricChange(metric.name, values[0])}
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{formatValue(metric.min || -100, metric.type)}</span>
                  <span>{formatValue(metric.max || 100, metric.type)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 space-y-4">
            <h5 className="text-sm font-medium text-slate-700 mb-2">Key Insights</h5>
            <div className="text-sm text-slate-600 space-y-2">
              {impact.growth > 15 && (
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-green-100 p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  </div>
                  <p>This scenario shows exceptional growth potential, but verify the assumptions are realistic.</p>
                </div>
              )}
              
              {impact.growth < -15 && (
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-red-100 p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  </div>
                  <p>This scenario shows significant revenue risk and may require mitigation strategies.</p>
                </div>
              )}
              
              {(scenarioMetrics.find(m => m.name === "Price Increase")?.value ?? 0) > 10 && (
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-amber-100 p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  </div>
                  <p>Price increases over 10% may affect customer retention and long-term value.</p>
                </div>
              )}
              
              {(scenarioMetrics.find(m => m.name === "Marketing Budget")?.value ?? 0) > 30 && (
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  </div>
                  <p>Large marketing increases have diminishing returns; consider targeted campaigns.</p>
                </div>
              )}
              
              {impact.confidence === "low" && (
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-slate-100 p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  </div>
                  <p>This scenario has low prediction confidence due to extreme parameter values.</p>
                </div>
              )}
              
              {/* Fallback insight */}
              {impact.growth >= -15 && impact.growth <= 15 && impact.confidence !== "low" && (
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-slate-100 p-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                  </div>
                  <p>This scenario shows moderate changes. Try adjusting parameters to see more significant impacts.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 