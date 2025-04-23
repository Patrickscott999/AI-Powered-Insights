"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { 
  ChevronRight, 
  BarChart, 
  LineChart as LineChartIcon, 
  PieChart, 
  ScatterChart, 
  TrendingUp, 
  Sliders as LucideSliders,
  Info, 
  AlertCircle,
  DollarSign,
  Package,
  Users,
  BarChart2,
  Lightbulb,
  Send
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface DataChatProps {
  data: any[] | null
  statistics: any | null
  onVisualizeData?: (type: string, config: any) => void
  onShowPrediction: () => void
  onShowScenario: (scenarioName: string) => void
}

// Update Message type to include predictive and scenario suggestions
type Message = {
  role: 'user' | 'assistant'
  content: string
  suggestions?: VisualizationSuggestion[]
  predictiveSuggestion?: PredictiveSuggestion
  scenarioSuggestion?: ScenarioSuggestion
  timestamp: Date
}

interface VisualizationSuggestion {
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title: string;
  description: string;
  x: string;
  y: string;
  color: string;
  icon: React.ReactNode;
}

// Add new types for predictive analytics and what-if scenarios
type PredictiveSuggestion = {
  title: string
  description: string
  forecastData: any
}

type ScenarioSuggestion = {
  title: string
  description: string
  scenarios: {
    name: string
    description: string
    metrics: {
      name: string
      value: number
      type: "percentage" | "number" | "currency"
    }[]
  }[]
}

// Create a context interface to store conversation context
interface ConversationContext {
  recentTopics: string[];
  mentionedColumns: string[];
  lastQuestion?: string;
  preferredVisualization?: string;
}

// Add a type for quality insights tooltips
type QualityTooltip = {
  trigger: string;
  content: string;
  type: 'warning' | 'info' | 'error';
}

export function DataChat({ data, statistics, onVisualizeData, onShowPrediction, onShowScenario }: DataChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `# Welcome to your Business Intelligence Analyst

I'm your AI Business Analyst, ready to help you derive actionable insights from your data.

**How I can help you:**
- 📈 Identify revenue growth opportunities
- 🛒 Optimize your product mix and pricing strategies
- 👥 Segment customers for targeted marketing
- ⏱️ Improve operational efficiency
- 🔍 Answer any questions about your data

Try asking questions like:
- "How can I improve my business performance?"
- "What strategies would increase our revenue?"
- "Show me the main trends in this data"
- "Which products are performing best?"`,
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  // Add conversation context to maintain history
  const [conversationContext, setConversationContext] = useState<ConversationContext>({
    recentTopics: [],
    mentionedColumns: []
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Extract columns from data when it changes
  useEffect(() => {
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      // Update context with available columns
      setConversationContext(prev => ({
        ...prev,
        availableColumns: columns
      }));
    }
  }, [data]);

  // Update context based on user question
  const updateConversationContext = (question: string) => {
    // Simple keyword extraction
    const keywords = question.toLowerCase().split(/\s+/);
    const topics = keywords.filter(word => 
      word.length > 3 && 
      ['trend', 'compare', 'insight', 'analysis', 'correlation', 'performance', 'recommend', 'predict', 'forecast', 'what if', 'scenario'].some(topic => 
        word.includes(topic)
      )
    );
    
    // Extract possible column mentions
    const mentionedColumns = data && data.length > 0 
      ? Object.keys(data[0]).filter(col => 
          question.toLowerCase().includes(col.toLowerCase())
        )
      : [];
    
    // Helper function to merge arrays and remove duplicates
    const mergeUnique = (arr1: string[], arr2: string[]): string[] => {
      return [...arr1, ...arr2]
        .filter((item, index, self) => self.indexOf(item) === index)
        .slice(0, 5);
    };
    
    setConversationContext(prev => ({
      ...prev,
      recentTopics: mergeUnique(topics, prev.recentTopics),
      mentionedColumns: mergeUnique(mentionedColumns, prev.mentionedColumns),
      lastQuestion: question
    }));
  };

  // Enhanced visualization suggestions
  const generateVisualizationSuggestions = useMemo(() => {
    if (!data || data.length === 0) return [];

    const columns = Object.keys(data[0] || {});
    const numericColumns = columns.filter(col => 
      !isNaN(Number(data[0][col])) && 
      typeof data[0][col] !== 'boolean'
    );
    const categoricalColumns = columns.filter(col => 
      isNaN(Number(data[0][col])) || 
      typeof data[0][col] === 'boolean'
    );
    
    const suggestions: VisualizationSuggestion[] = [];
    
    // Revenue Analysis
    const revenueColumns = numericColumns.filter(col => 
      col.toLowerCase().includes('revenue') || 
      col.toLowerCase().includes('sales') || 
      col.toLowerCase().includes('price') ||
      col.toLowerCase().includes('profit')
    );
    
    if (revenueColumns.length > 0) {
      suggestions.push({
        title: "Revenue Analysis",
        description: "Analyze your revenue patterns to identify growth opportunities",
        icon: <DollarSign className="h-4 w-4" />,
        type: "bar",
        x: categoricalColumns[0] || columns[0],
        y: revenueColumns[0],
        color: "#10b981" // Green color for revenue
      });
    }
    
    // Product Performance
    const productColumns = categoricalColumns.filter(col => 
      col.toLowerCase().includes('product') || 
      col.toLowerCase().includes('item') || 
      col.toLowerCase().includes('category')
    );
    
    if (productColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        title: "Product Performance",
        description: "Compare performance across your product portfolio",
        icon: <Package className="h-4 w-4" />,
        type: "bar",
        x: productColumns[0],
        y: numericColumns[0],
        color: "#3b82f6" // Blue color for products
      });
    }
    
    // Customer Segmentation
    const customerColumns = categoricalColumns.filter(col => 
      col.toLowerCase().includes('customer') || 
      col.toLowerCase().includes('client') || 
      col.toLowerCase().includes('segment')
    );
    
    if (customerColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        title: "Customer Segmentation",
        description: "Analyze performance across customer segments",
        icon: <Users className="h-4 w-4" />,
        type: "pie",
        x: customerColumns[0],
        y: numericColumns[0],
        color: "#8b5cf6" // Purple color for customers
      });
    }
    
    // Time Trend Analysis
    const timeColumns = categoricalColumns.filter(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('month') || 
      col.toLowerCase().includes('year') ||
      col.toLowerCase().includes('period')
    );
    
    if (timeColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        title: "Trend Analysis",
        description: "Identify patterns and trends over time",
        icon: <TrendingUp className="h-4 w-4" />,
        type: "line",
        x: timeColumns[0],
        y: numericColumns[0],
        color: "#f59e0b" // Amber color for trends
      });
    }
    
    // Add default visualizations if we don't have enough specific ones
    if (suggestions.length < 2 && numericColumns.length > 0 && categoricalColumns.length > 0) {
      suggestions.push({
        title: "Data Overview",
        description: "General overview of your business data",
        icon: <BarChart2 className="h-4 w-4" />,
        type: "bar",
        x: categoricalColumns[0],
        y: numericColumns[0],
        color: "#6366f1" // Indigo color for general
      });
    }
    
    return suggestions;
  }, [data]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: VisualizationSuggestion) => {
    if (onVisualizeData) {
      // Configure visualization based on suggestion type
      let config: any = {
        xAxis: suggestion.x,
        yAxis: suggestion.y,
        aggregation: 'sum',
        color: suggestion.color
      };
      
      onVisualizeData(suggestion.type, config);
      
      // Add a confirmation message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've created a ${suggestion.title.toLowerCase()} based on your data.`,
        timestamp: new Date()
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !data) return

    // Add user message
    const userMessage = { role: 'user' as const, content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    
    // Update conversation context with new question
    updateConversationContext(input);
    
    setInput('')
    setIsLoading(true)

    try {
      // Check for predictive or scenario questions before sending to API
      const predictiveSuggestion = generatePredictiveSuggestion(input);
      const scenarioSuggestion = generateScenarioSuggestion(input);
      
      // Prepare the payload with the user's question, context, and the current data
      const payload = {
        question: input,
        data: data.slice(0, 50), // Only send a sample of the data to avoid payload size issues
        statistics: statistics,
        context: conversationContext // Send context to API
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const result = await response.json()
      
      // Generate visualization suggestions
      const suggestions = generateVisualizationSuggestionsFromChat(input, result.answer);
      
      // Add assistant response with all relevant suggestions
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.answer,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        predictiveSuggestion,
        scenarioSuggestion,
        timestamp: new Date()
      }])
    } catch (error) {
      console.error('Error processing chat:', error)
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Function to get icon for visualization type
  const getVisualizationIcon = (type: VisualizationSuggestion['type']) => {
    switch (type) {
      case 'bar': return <BarChart className="h-4 w-4" />;
      case 'line': return <LineChartIcon className="h-4 w-4" />;
      case 'pie': return <PieChart className="h-4 w-4" />;
      case 'scatter': return <ScatterChart className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  // Add a function to process message content and add quality tooltips
  const processMessageWithQualityInfo = (content: string): JSX.Element => {
    // If no statistics or data quality info, just return the text
    if (!statistics?.data_quality) {
      return <>{content}</>;
    }
    
    // Define quality tooltip triggers and their explanations
    const qualityTooltips: QualityTooltip[] = [
      {
        trigger: 'missing values',
        content: 'Missing values can lead to incomplete analysis and potentially biased insights.',
        type: 'warning'
      },
      {
        trigger: 'data quality score',
        content: `A higher score means more reliable insights. ${
          statistics.data_quality.overall_score < 70 ? 
          'Your current score suggests caution when making decisions based on this data.' : 
          'Your score indicates the data is generally reliable.'
        }`,
        type: statistics.data_quality.overall_score < 70 ? 'warning' : 'info'
      },
      {
        trigger: 'outliers',
        content: 'Extreme values can skew averages and affect the reliability of trends and correlations.',
        type: 'warning'
      },
      {
        trigger: 'inconsistent format',
        content: 'Inconsistent formatting can cause values to be misinterpreted or excluded from analysis.',
        type: 'error'
      },
      {
        trigger: 'duplicates',
        content: 'Duplicate records can inflate counts and skew distributions.',
        type: 'warning'
      }
    ];
    
    // Split content into segments to insert tooltips
    const segments = content.split(/\b/);
    
    return (
      <TooltipProvider>
        <p className="text-sm whitespace-pre-wrap">
          {segments.map((segment, i) => {
            // Check if this segment matches any quality tooltip trigger
            const matchedTooltip = qualityTooltips.find(tooltip => 
              segment.toLowerCase().includes(tooltip.trigger)
            );
            
            if (matchedTooltip) {
              return (
                <Tooltip key={i} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <span className={`
                      ${matchedTooltip.type === 'warning' ? 'text-amber-600 underline decoration-dotted underline-offset-4' : ''}
                      ${matchedTooltip.type === 'error' ? 'text-red-600 underline decoration-dotted underline-offset-4' : ''}
                      ${matchedTooltip.type === 'info' ? 'text-blue-600 underline decoration-dotted underline-offset-4' : ''}
                      cursor-help
                    `}>
                      {segment}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm">
                    <div className="flex">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{matchedTooltip.content}</span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }
            
            // Just return the regular text for non-matched segments
            return segment;
          })}
        </p>
      </TooltipProvider>
    );
  };

  // Add a new function to detect prediction-related questions
  const generatePredictiveSuggestion = (questionText: string): PredictiveSuggestion | undefined => {
    if (!statistics?.forecast) return undefined;
    
    const lowerQuestion = questionText.toLowerCase();
    
    // Check if this is a forecasting question
    if (lowerQuestion.includes('predict') || 
        lowerQuestion.includes('forecast') || 
        lowerQuestion.includes('future') ||
        lowerQuestion.includes('projection') ||
        lowerQuestion.includes('next month') ||
        lowerQuestion.includes('next week') ||
        lowerQuestion.includes('predict') ||
        lowerQuestion.includes('expect')) {
      
      return {
        title: 'Sales Forecast',
        description: 'View predicted future sales and trends',
        forecastData: statistics.forecast
      };
    }
    
    return undefined;
  };

  // Add a new function to detect what-if scenario questions
  const generateScenarioSuggestion = (questionText: string): ScenarioSuggestion | undefined => {
    if (!statistics?.forecast) return undefined;
    
    const lowerQuestion = questionText.toLowerCase();
    
    // Check if this is a what-if or scenario question
    if (lowerQuestion.includes('what if') || 
        lowerQuestion.includes('scenario') || 
        lowerQuestion.includes('simulation') ||
        lowerQuestion.includes('model') ||
        lowerQuestion.includes('happens if') ||
        lowerQuestion.includes('change price') ||
        lowerQuestion.includes('increase price') ||
        lowerQuestion.includes('decrease price') ||
        lowerQuestion.includes('marketing budget')) {
      
      // Create pre-defined scenarios based on the question
      const scenarios: Array<{
        name: string;
        description: string;
        metrics: Array<{
          name: string;
          value: number;
          type: "percentage" | "number" | "currency";
        }>;
      }> = [];
      
      // Default scenario
      scenarios.push({
        name: 'Custom Scenario',
        description: 'Create your own scenario with custom parameters',
        metrics: [
          {
            name: 'Price Increase',
            value: 0,
            type: 'percentage' as const
          },
          {
            name: 'Marketing Budget',
            value: 0,
            type: 'percentage' as const
          },
          {
            name: 'Discount Level',
            value: 0,
            type: 'percentage' as const
          }
        ]
      });
      
      // Add specific scenarios based on the question
      if (lowerQuestion.includes('price')) {
        const direction = lowerQuestion.includes('increase') ? 10 : -10;
        scenarios.push({
          name: `${direction > 0 ? 'Increase' : 'Decrease'} Price`,
          description: `Simulates ${Math.abs(direction)}% ${direction > 0 ? 'higher' : 'lower'} prices`,
          metrics: [
            {
              name: 'Price Increase',
              value: direction,
              type: 'percentage' as const
            },
            {
              name: 'Marketing Budget',
              value: 0,
              type: 'percentage' as const
            },
            {
              name: 'Discount Level',
              value: 0,
              type: 'percentage' as const
            }
          ]
        });
      }
      
      if (lowerQuestion.includes('marketing') || lowerQuestion.includes('promotion')) {
        scenarios.push({
          name: 'Increased Marketing',
          description: 'Simulates 30% increased marketing budget',
          metrics: [
            {
              name: 'Price Increase',
              value: 0,
              type: 'percentage' as const
            },
            {
              name: 'Marketing Budget',
              value: 30,
              type: 'percentage' as const
            },
            {
              name: 'Discount Level',
              value: 0,
              type: 'percentage' as const
            }
          ]
        });
      }
      
      return {
        title: 'What-If Scenario Modeling',
        description: 'Simulate different business scenarios to see potential outcomes',
        scenarios
      };
    }
    
    return undefined;
  };

  // Add function to handle predictive suggestion click
  const handlePredictiveSuggestionClick = () => {
    if (onShowPrediction) {
      onShowPrediction();
      
      // Add a message about switching to forecast view
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've opened the forecast view where you can explore predicted future trends and patterns in detail.`,
        timestamp: new Date()
      }]);
    }
  };

  // Add function to handle scenario suggestion click
  const handleScenarioSuggestionClick = (scenarioName: string) => {
    if (onShowScenario) {
      onShowScenario(scenarioName);
      
      // Add a message about switching to scenario view
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've opened the scenario modeling tool with the "${scenarioName}" scenario. You can adjust parameters to see how they would affect your business outcomes.`,
        timestamp: new Date()
      }]);
    }
  };

  // Generate visualization suggestions based on message context
  const generateVisualizationSuggestionsFromChat = (questionText: string, responseText: string) => {
    // Return the preset suggestions we created based on data structure
    return generateVisualizationSuggestions;
  };

  return (
    <div className="flex flex-col h-[400px] bg-white rounded-xl overflow-hidden border border-slate-200">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
        <h3 className="font-medium">Data Assistant</h3>
        <p className="text-xs text-blue-100">Ask questions about your data</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              <div 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    // Use the enhanced message processor for assistant messages
                    processMessageWithQualityInfo(message.content)
                  )}
                </div>
              </div>
              
              {/* Visualization suggestions */}
              {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                <div className="pl-2 mt-1 mb-2">
                  {message.suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="inline-flex items-center px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {suggestion.icon}
                      <span className="ml-1.5 mr-0.5">{suggestion.title}</span>
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    </button>
                  ))}
                </div>
              )}
              
              {/* Predictive forecast suggestion */}
              {message.role === 'assistant' && message.predictiveSuggestion && (
                <div className="pl-2 mt-1 mb-2">
                  <button
                    onClick={handlePredictiveSuggestionClick}
                    className="inline-flex items-center px-3 py-1.5 text-xs bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                    <span className="mr-0.5">{message.predictiveSuggestion.title}</span>
                    <ChevronRight className="h-3 w-3 opacity-50" />
                  </button>
                </div>
              )}
              
              {/* What-if scenario suggestion */}
              {message.role === 'assistant' && message.scenarioSuggestion && (
                <div className="pl-2 mt-1 mb-2">
                  <div>
                    <button
                      onClick={() => handleScenarioSuggestionClick('Custom Scenario')}
                      className="inline-flex items-center px-3 py-1.5 text-xs bg-amber-50 border border-amber-200 rounded-full text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <LucideSliders className="h-3.5 w-3.5 mr-1.5" />
                      <span className="mr-0.5">What-If Analysis</span>
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    </button>
                  </div>
                  
                  {message.scenarioSuggestion.scenarios.length > 0 && (
                    <div className="mt-1 pl-1 flex flex-wrap gap-1">
                      <span className="text-xs text-slate-500 mt-1 mr-1">Try Scenarios:</span>
                      {message.scenarioSuggestion.scenarios.map((scenario, i) => (
                        <button
                          key={i}
                          onClick={() => handleScenarioSuggestionClick(scenario.name)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Lightbulb className="h-3 w-3 mr-1 text-amber-500" />
                          {scenario.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-800 max-w-[80%] rounded-lg p-3 rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-slate-200">
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            disabled={isLoading || !data}
            className="flex-1"
          />
          <Button 
            type="submit"
            disabled={isLoading || !input.trim() || !data}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </Button>
        </form>
        {!data && (
          <p className="text-xs text-slate-500 mt-2">Upload data to start asking questions</p>
        )}
      </div>
    </div>
  )
} 