"use client"

import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Card, Metric, Text, BadgeDelta, Flex
} from "@tremor/react";
import { Sparkles } from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define what-if scenario types
interface ScenarioParameter {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  value: number;
  description: string;
}

interface ScenarioData {
  id: string;
  name: string;
  parameters: ScenarioParameter[];
  description: string;
}

interface ScenarioResult {
  direction: 'up' | 'down' | 'neutral';
  percentage: number;
  description: string;
  insight: string;
  data: Array<{
    name: string;
    baseline: number;
    scenario: number;
  }>;
}

interface ScenarioState {
  isLoading: boolean;
  result: ScenarioResult | null;
}

interface WhatIfScenarioProps {
  forecastData?: any;
}

// Helper function to determine the tremor badge delta type
const getDeltaType = (value: number): "increase" | "decrease" | "unchanged" => {
  if (value > 0) return "increase";
  if (value < 0) return "decrease";
  return "unchanged";
};

// Helper function to format values based on type
const formatValue = (value: number, type: string): string => {
  if (type === "currency") return `$${value.toLocaleString()}`;
  if (type === "percentage") return `${value}%`;
  return value.toString();
};

// Default scenarios
const DEFAULT_SCENARIOS: ScenarioData[] = [
  {
    id: "pricing",
    name: "Pricing Strategy",
    description: "Analyze the impact of price changes on revenue",
    parameters: [
      {
        id: "price",
        name: "Price Change",
        min: -30,
        max: 50,
        step: 1,
        value: 0,
        description: "Percentage change in product pricing"
      },
      {
        id: "elasticity",
        name: "Demand Elasticity",
        min: -100,
        max: 0,
        step: 5,
        value: -20,
        description: "How sensitive is demand to price changes"
      }
    ]
  },
  {
    id: "marketing",
    name: "Marketing Campaign",
    description: "Simulate impact of marketing spend changes",
    parameters: [
      {
        id: "budget",
        name: "Budget Increase",
        min: 0,
        max: 100,
        step: 5,
        value: 20,
        description: "Percentage increase in marketing budget"
      },
      {
        id: "efficiency",
        name: "Campaign Efficiency",
        min: -50,
        max: 50,
        step: 5,
        value: 0,
        description: "How effective the campaign is vs baseline"
      }
    ]
  },
  {
    id: "expansion",
    name: "Market Expansion",
    description: "Project results of entering new markets",
    parameters: [
      {
        id: "reach",
        name: "Market Reach",
        min: 5,
        max: 50,
        step: 5,
        value: 15,
        description: "Percentage of new customers reached"
      },
      {
        id: "cost",
        name: "Expansion Cost",
        min: 10,
        max: 100,
        step: 5,
        value: 30,
        description: "Investment required for expansion"
      }
    ]
  }
];

export function WhatIfScenario({ forecastData }: WhatIfScenarioProps) {
  // State management
  const [activeScenario, setActiveScenario] = useState<string>("pricing");
  const [activeScenarioData, setActiveScenarioData] = useState<ScenarioData | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [scenario, setScenario] = useState<ScenarioState>({
    isLoading: false,
    result: null
  });

  // Initialize scenario data
  useEffect(() => {
    const currentScenario = DEFAULT_SCENARIOS.find(s => s.id === activeScenario);
    if (currentScenario) {
      setActiveScenarioData(currentScenario);
      
      // Initialize parameter values
      const initialValues: Record<string, number> = {};
      currentScenario.parameters.forEach(param => {
        initialValues[param.id] = param.value;
      });
      setParamValues(initialValues);
    }
  }, [activeScenario]);

  // Handle slider value changes
  const handleSliderChange = (paramId: string, value: number) => {
    setParamValues(prev => ({
      ...prev,
      [paramId]: value
    }));
  };

  // Get current parameter value for display
  const getParameterValue = (param: ScenarioParameter): number => {
    return paramValues[param.id] !== undefined ? paramValues[param.id] : param.value;
  };

  // Run scenario simulation
  const runScenario = async () => {
    if (!activeScenarioData) return;
    
    setScenario(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate scenario result based on parameters
    // In a real app, this would call an API endpoint
    const result: ScenarioResult = {
      direction: 'up',
      percentage: 12.5,
      description: 'Projected increase in revenue based on your parameters',
      insight: 'Your changes would likely increase customer acquisition while maintaining profitability. Consider implementing gradually to monitor actual market response.',
      data: Array.from({ length: 12 }, (_, i) => ({
        name: `Month ${i+1}`,
        baseline: 1000 + (i * 50),
        scenario: 1000 + (i * 50) * (1 + (paramValues[Object.keys(paramValues)[0]] || 0) / 100)
      }))
    };
    
    setScenario({
      isLoading: false,
      result
    });
  };

  // If forecast data is available, show prediction
  return (
    <div className="space-y-6">
      <div className="pb-2 mb-4 border-b">
        <h3 className="text-xl font-semibold">What-If Scenario Analysis</h3>
        <p className="text-sm text-muted-foreground">
          Explore how different changes might impact your business performance
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4 md:border-r md:pr-4">
          <div>
            <h4 className="font-medium mb-2">Choose a scenario</h4>
            <Select
              value={activeScenario}
              onValueChange={setActiveScenario}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_SCENARIOS.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-2">
            <h4 className="font-medium mb-2">Adjust parameters</h4>
            
            {activeScenarioData && (
              <div className="space-y-4">
                {activeScenarioData.parameters.map(param => (
                  <div key={param.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{param.name}</span>
                      <span className="font-medium">{getParameterValue(param)}%</span>
                    </div>
                    <Slider
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      value={[paramValues[param.id]]}
                      onValueChange={(vals) => handleSliderChange(param.id, vals[0])}
                    />
                    <p className="text-xs text-slate-500">{param.description}</p>
                  </div>
                ))}
                
                <Button 
                  className="w-full mt-2" 
                  size="sm"
                  onClick={runScenario}
                >
                  Run Scenario
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Projected impact</h4>
          
          {scenario.isLoading ? (
            <div className="h-60 flex items-center justify-center">
              <div className="animate-pulse text-center">
                <div className="h-4 w-32 bg-slate-200 rounded mb-3 mx-auto"></div>
                <div className="h-4 w-40 bg-slate-200 rounded mb-3 mx-auto"></div>
                <div className="h-32 w-full bg-slate-100 rounded"></div>
              </div>
            </div>
          ) : scenario.result ? (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h5 className="font-medium text-green-800 mb-1">Projected Outcome</h5>
                <div className="text-2xl font-bold text-green-700">
                  {scenario.result.direction === 'up' ? '+' : '-'}{scenario.result.percentage}%
                </div>
                <p className="text-sm text-green-700 mt-1">
                  {scenario.result.description}
                </p>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scenario.result.data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{fontSize: 12}}
                    />
                    <YAxis 
                      tick={{fontSize: 12}}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}`, 'Value']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      name="Baseline"
                      dataKey="baseline" 
                      stroke="#8884d8" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                    <Line 
                      type="monotone" 
                      name="Scenario"
                      dataKey="scenario" 
                      stroke="#82ca9d" 
                      strokeWidth={2} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-1">Business Insight</h5>
                <p className="text-sm text-blue-700">
                  {scenario.result.insight}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 text-center h-60 flex items-center justify-center rounded-lg">
              <div>
                <p className="text-slate-500 mb-2">
                  Select a scenario and run it to see projections
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => runScenario()}
                >
                  Run Default Scenario
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 