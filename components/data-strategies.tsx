"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DataStrategiesProps {
  data?: any[];
  statistics?: any;
}

// Strategy type icons
const strategyIcons: Record<string, JSX.Element> = {
  sales: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
    </svg>
  ),
  marketing: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>
  ),
  inventory: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
      <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
  ),
  customer: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  ),
  operations: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.64l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" />
      <path d="M10.076 8.64l-2.201-2.2V4.874a.75.75 0 00-.364-.643l-3.75-2.25a.75.75 0 00-.916.113l-.75.75a.75.75 0 00-.113.916l2.25 3.75a.75.75 0 00.643.364h1.564l2.062 2.062 1.575-1.297z" />
      <path fillRule="evenodd" d="M12.556 17.329l4.183 4.182a3.375 3.375 0 004.773-4.773l-3.306-3.305a6.803 6.803 0 01-1.53.043c-.394-.034-.682-.006-.867.042a.589.589 0 00-.167.063l-3.086 3.748zm3.414-1.36a.75.75 0 011.06 0l1.875 1.876a.75.75 0 11-1.06 1.06L15.97 17.03a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  )
};

// Strategy colors
const strategyColors: Record<string, { bg: string, text: string, border: string, icon: string }> = {
  sales: { 
    bg: "bg-emerald-50", 
    text: "text-emerald-900", 
    border: "border-emerald-200",
    icon: "text-emerald-600"
  },
  marketing: { 
    bg: "bg-pink-50", 
    text: "text-pink-900", 
    border: "border-pink-200",
    icon: "text-pink-600"
  },
  inventory: { 
    bg: "bg-cyan-50", 
    text: "text-cyan-900", 
    border: "border-cyan-200",
    icon: "text-cyan-600"
  },
  customer: { 
    bg: "bg-indigo-50", 
    text: "text-indigo-900", 
    border: "border-indigo-200",
    icon: "text-indigo-600"
  },
  operations: { 
    bg: "bg-amber-50", 
    text: "text-amber-900", 
    border: "border-amber-200",
    icon: "text-amber-600"
  }
};

export function DataStrategies({ data, statistics }: DataStrategiesProps) {
  const [strategies, setStrategies] = useState<{
    type: string;
    title: string;
    description: string;
    actions: string[];
  }[]>([]);

  // Determine appropriate strategies based on the data
  useEffect(() => {
    if (!data || !statistics) return;
    
    const detectedStrategies: {
      type: string;
      title: string;
      description: string;
      actions: string[];
    }[] = [];

    // Analyze data and determine appropriate strategies
    try {
      // Check for time-based patterns
      if (statistics.time_patterns) {
        const timePatterns = statistics.time_patterns;
        
        if (timePatterns.hourly || timePatterns.daily) {
          detectedStrategies.push({
            type: "operations",
            title: "Operational Timing Strategy",
            description: "Optimize your operations based on time patterns in your data.",
            actions: [
              "Schedule staff during peak hours/days",
              "Plan inventory replenishment before high-demand periods",
              "Implement dynamic pricing based on demand patterns"
            ]
          });
        }
      }

      // Check for product associations - handle cases where data might be missing or improperly structured
      try {
        if (statistics.product_associations && 
            typeof statistics.product_associations === 'object' && 
            Object.keys(statistics.product_associations).length > 0) {
          detectedStrategies.push({
            type: "marketing",
            title: "Cross-Selling Strategy",
            description: "Leverage product associations to increase average order value.",
            actions: [
              "Create product bundles based on frequently purchased combinations",
              "Implement 'Frequently bought together' recommendations",
              "Train sales staff on complementary product suggestions"
            ]
          });
        }
      } catch (error) {
        console.log("Product association data not available or invalid format");
      }

      // Check for customer segments - handle cases where data might be missing or improperly structured
      try {
        if (statistics.customer_segments && 
            typeof statistics.customer_segments === 'object' && 
            statistics.customer_segments.segments && 
            typeof statistics.customer_segments.segments === 'object' && 
            Object.keys(statistics.customer_segments.segments).length > 0) {
          detectedStrategies.push({
            type: "customer",
            title: "Customer Segmentation Strategy",
            description: "Tailor your approach to different customer segments.",
            actions: [
              "Develop targeted marketing campaigns for each segment",
              "Customize product offerings based on segment preferences",
              "Implement loyalty programs for high-value segments"
            ]
          });
        }
      } catch (error) {
        console.log("Customer segmentation data not available or invalid format");
      }

      // Check for numeric columns that might indicate sales/revenue
      const numericColumns = Object.keys(statistics.numeric_columns || {});
      const valueLikeColumns = numericColumns.filter(col => 
        col.toLowerCase().includes('price') || 
        col.toLowerCase().includes('revenue') || 
        col.toLowerCase().includes('sale') ||
        col.toLowerCase().includes('amount')
      );
      
      if (valueLikeColumns.length > 0) {
        const col = valueLikeColumns[0];
        const stats = statistics.numeric_columns[col];
        const variability = stats.std / stats.mean;
        
        if (variability > 0.5) {
          detectedStrategies.push({
            type: "sales",
            title: "Price Optimization Strategy",
            description: `High variability detected in ${col} (${(variability * 100).toFixed(0)}% of mean).`,
            actions: [
              "Implement tiered pricing structures",
              "Analyze high and low price points for profitability",
              "Consider price elasticity testing"
            ]
          });
        } else {
          detectedStrategies.push({
            type: "sales",
            title: "Value Enhancement Strategy",
            description: `Consistent ${col} values with average of ${stats.mean.toFixed(2)}.`,
            actions: [
              "Focus on gradual price increases",
              "Add value-added services to justify higher prices",
              "Bundle products to increase average transaction value"
            ]
          });
        }
      }

      // Check for categorical columns that might represent products
      const categoricalColumns = Object.keys(statistics.categorical_columns || {});
      const productLikeColumns = categoricalColumns.filter(col => 
        col.toLowerCase().includes('product') || 
        col.toLowerCase().includes('item') || 
        col.toLowerCase() === 'good'
      );
      
      if (productLikeColumns.length > 0) {
        const productCol = productLikeColumns[0];
        const stats = statistics.categorical_columns[productCol];
        
        detectedStrategies.push({
          type: "inventory",
          title: "Product Mix Optimization",
          description: `Analysis of ${stats.unique_values} different products in your inventory.`,
          actions: [
            `Focus marketing efforts on top performer: "${stats.most_common}"`,
            "Consider phasing out or revamping bottom 20% of products",
            "Optimize inventory levels based on product velocity"
          ]
        });
      }
      
      // Add default strategies if none were detected
      if (detectedStrategies.length === 0) {
        detectedStrategies.push({
          type: "operations",
          title: "Data Quality Strategy",
          description: "Focus on improving your data collection for better insights.",
          actions: [
            "Standardize data collection processes",
            "Implement data validation rules",
            "Capture additional data points for richer analysis"
          ]
        });
      }

      setStrategies(detectedStrategies);
    } catch (error) {
      console.error("Error determining strategies:", error);
      // Fallback with a generic strategy
      setStrategies([{
        type: "operations",
        title: "Data Enhancement Strategy",
        description: "Improve your data for better business insights.",
        actions: [
          "Ensure consistent data collection",
          "Add relevant business metrics to your dataset",
          "Consider tracking additional KPIs"
        ]
      }]);
    }
  }, [data, statistics]);

  if (!data || strategies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended Strategies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            Upload data to receive tailored business strategies
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full rounded-md">
          <div className="grid grid-cols-1 gap-6 p-2">
            {strategies.map((strategy, index) => {
              const colors = strategyColors[strategy.type];
              const icon = strategyIcons[strategy.type];
              
              return (
                <div 
                  key={index} 
                  className={`rounded-xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${colors.border} border`}
                >
                  <div className={`px-5 py-4 ${colors.bg} border-b ${colors.border} flex items-center`}>
                    <div className={`rounded-full p-1.5 ${colors.icon} mr-3`}>
                      {icon}
                    </div>
                    <h3 className={`text-lg font-bold ${colors.text}`}>
                      {strategy.title}
                    </h3>
                  </div>
                  
                  <div className="bg-white p-5">
                    <p className="text-sm text-slate-600 mb-4">{strategy.description}</p>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800">Action Steps:</h4>
                      {strategy.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="ml-1 flex items-start">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs mr-2 flex-shrink-0">
                            {actionIndex + 1}
                          </div>
                          <div className="text-sm text-slate-600">
                            {action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
