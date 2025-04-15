"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { ChevronRight, BarChart, LineChart as LineChartIcon, PieChart, ScatterChart, Info } from 'lucide-react'

interface DataChatProps {
  data: any[] | null
  statistics: any | null
  onVisualizationRequest?: (type: string, config: any) => void
}

type Message = {
  role: 'user' | 'assistant'
  content: string
  suggestions?: VisualizationSuggestion[]
}

type VisualizationSuggestion = {
  type: 'bar' | 'line' | 'pie' | 'scatter'
  title: string
  description: string
  config: any
}

// Create a context interface to store conversation context
interface ConversationContext {
  recentTopics: string[];
  mentionedColumns: string[];
  lastQuestion?: string;
  preferredVisualization?: string;
}

export function DataChat({ data, statistics, onVisualizationRequest }: DataChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help answer questions about your data. What would you like to know?'
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
      ['trend', 'compare', 'insight', 'analysis', 'correlation', 'performance', 'recommend'].some(topic => 
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

  // Generate visualization suggestions based on the response
  const generateVisualizationSuggestions = (questionText: string, responseText: string): VisualizationSuggestion[] => {
    if (!data || data.length === 0) return [];
    
    const lowerQuestion = questionText.toLowerCase();
    const lowerResponse = responseText.toLowerCase();
    const columns = Object.keys(data[0]);
    const numericColumns = columns.filter(col => 
      typeof data[0][col] === 'number'
    );
    const categoricalColumns = columns.filter(col => 
      typeof data[0][col] === 'string' || typeof data[0][col] === 'boolean'
    );
    
    const suggestions: VisualizationSuggestion[] = [];
    
    // Detect time series questions
    if (lowerQuestion.includes('trend') || lowerQuestion.includes('over time') || 
        lowerResponse.includes('trend') || lowerResponse.includes('over time')) {
      
      if (numericColumns.length > 0) {
        suggestions.push({
          type: 'line',
          title: 'Time Series Chart',
          description: 'View trends over time',
          config: {
            xAxis: statistics?.time_column || categoricalColumns[0] || 'index',
            yAxis: numericColumns[0],
            aggregation: 'sum'
          }
        });
      }
    }
    
    // Detect comparison questions
    if (lowerQuestion.includes('compare') || lowerQuestion.includes('difference') || 
        lowerResponse.includes('compare') || lowerResponse.includes('highest')) {
      
      if (numericColumns.length > 0 && categoricalColumns.length > 0) {
        suggestions.push({
          type: 'bar',
          title: 'Comparison Chart',
          description: 'Compare values across categories',
          config: {
            xAxis: categoricalColumns[0],
            yAxis: numericColumns[0],
            aggregation: 'sum'
          }
        });
      }
    }
    
    // Detect distribution questions
    if (lowerQuestion.includes('distribution') || lowerQuestion.includes('spread') || 
        lowerResponse.includes('distribution') || lowerResponse.includes('spread')) {
      
      if (categoricalColumns.length > 0) {
        suggestions.push({
          type: 'pie',
          title: 'Distribution Chart',
          description: 'View proportional breakdown',
          config: {
            category: categoricalColumns[0],
            value: numericColumns[0] || 'count'
          }
        });
      }
    }
    
    // Detect correlation questions
    if (lowerQuestion.includes('correlation') || lowerQuestion.includes('relationship') || 
        lowerResponse.includes('correlation') || lowerResponse.includes('relationship')) {
      
      if (numericColumns.length >= 2) {
        suggestions.push({
          type: 'scatter',
          title: 'Correlation Chart',
          description: 'Explore relationships between variables',
          config: {
            xAxis: numericColumns[0],
            yAxis: numericColumns[1]
          }
        });
      }
    }
    
    return suggestions.slice(0, 3); // Return up to 3 suggestions
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: VisualizationSuggestion) => {
    if (onVisualizationRequest) {
      onVisualizationRequest(suggestion.type, suggestion.config);
      
      // Update context with preferred visualization
      setConversationContext(prev => ({
        ...prev,
        preferredVisualization: suggestion.type
      }));
      
      // Add a message about the visualization
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I've created a ${suggestion.title.toLowerCase()} based on your data.`
      }]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !data) return

    // Add user message
    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    
    // Update conversation context with new question
    updateConversationContext(input);
    
    setInput('')
    setIsLoading(true)

    try {
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
      const suggestions = generateVisualizationSuggestions(input, result.answer);
      
      // Add assistant response with suggestions
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.answer,
        suggestions: suggestions.length > 0 ? suggestions : undefined
      }])
    } catch (error) {
      console.error('Error processing chat:', error)
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your question. Please try again.' 
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
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
              
              {/* Visualization suggestions */}
              {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                <div className="pl-2 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, suggIndex) => (
                    <button
                      key={suggIndex}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="inline-flex items-center px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {getVisualizationIcon(suggestion.type)}
                      <span className="ml-1.5 mr-0.5">{suggestion.title}</span>
                      <ChevronRight className="h-3 w-3 opacity-50" />
                    </button>
                  ))}
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