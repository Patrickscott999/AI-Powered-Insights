"use client"

import { useEffect, useState } from "react"

interface InsightsSummaryProps {
  summary?: string;
  data?: any[];
  statistics?: any;
}

// Icons for different insight types
const icons: Record<string, JSX.Element> = {
  revenue: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
      <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
      <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
    </svg>
  ),
  product: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
      <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.133 2.845a.75.75 0 011.06 0l1.72 1.72 1.72-1.72a.75.75 0 111.06 1.06l-1.72 1.72 1.72 1.72a.75.75 0 11-1.06 1.06L12 15.685l-1.72 1.72a.75.75 0 11-1.06-1.06l1.72-1.72-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  ),
  business: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm4.5 7.5a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0v-2.25a.75.75 0 01.75-.75zm3.75-1.5a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0V12zm2.25-3a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0V9.75A.75.75 0 0113.5 9zm3.75-1.5a.75.75 0 00-1.5 0v9a.75.75 0 001.5 0v-9z" clipRule="evenodd" />
    </svg>
  ),
  performance: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z" clipRule="evenodd" />
    </svg>
  ),
  default: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M2.25 2.25a.75.75 0 000 1.5H3v10.5a3 3 0 003 3h1.21l-1.172 3.513a.75.75 0 001.424.474l.329-.987h8.418l.33.987a.75.75 0 001.422-.474l-1.17-3.513H18a3 3 0 003-3V3.75h.75a.75.75 0 000-1.5H2.25zm6.04 16.5l.5-1.5h6.42l.5 1.5H8.29zm7.46-12a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm-3 2.25a.75.75 0 00-1.5 0v3.75a.75.75 0 001.5 0V9zm-3 2.25a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
    </svg>
  )
};

// Colors for different insight sections
const sectionColors: Record<string, { bg: string, text: string, border: string, icon: string }> = {
  revenue: { 
    bg: "bg-green-50", 
    text: "text-green-900", 
    border: "border-green-200",
    icon: "text-green-600"
  },
  product: { 
    bg: "bg-blue-50", 
    text: "text-blue-900", 
    border: "border-blue-200",
    icon: "text-blue-600"
  },
  business: { 
    bg: "bg-purple-50", 
    text: "text-purple-900", 
    border: "border-purple-200",
    icon: "text-purple-600"
  },
  performance: { 
    bg: "bg-amber-50", 
    text: "text-amber-900", 
    border: "border-amber-200",
    icon: "text-amber-600"
  },
  default: { 
    bg: "bg-slate-50", 
    text: "text-slate-900", 
    border: "border-slate-200",
    icon: "text-slate-600"
  }
};

export function InsightsSummary({ summary, data, statistics }: InsightsSummaryProps) {
  const [sections, setSections] = useState<{
    title: string;
    type: string;
    points: { text: string; isHeader: boolean }[];
  }[]>([]);
  
  const [generatedSummary, setGeneratedSummary] = useState<string | null>(null);

  // Generate a summary from data and statistics if no summary is provided
  useEffect(() => {
    if (!summary && data && data.length > 0 && statistics) {
      // Generate a basic summary from the available data and statistics
      const basicSummary = generateBasicSummary(data, statistics);
      setGeneratedSummary(basicSummary);
    } else if (summary) {
      setGeneratedSummary(null); // Clear generated summary if a real one is provided
    }
  }, [summary, data, statistics]);

  // Process the summary into sections
  useEffect(() => {
    const summaryToProcess = summary || generatedSummary;
    if (!summaryToProcess) return;
    
    // Split the summary into lines
    const lines = summaryToProcess.split('\n').filter(line => line.trim() !== '');
    
    // Process the markdown structure
    let currentSection: {
      title: string;
      type: string;
      points: { text: string; isHeader: boolean }[];
    } = { 
      title: "Business Insights", 
      type: "default", 
      points: [] 
    };
    
    const processedSections: typeof sections = [];
    let mainTitleFound = false;
    
    lines.forEach(line => {
      // Check if it's a main title (# heading)
      if (line.startsWith('# ')) {
        mainTitleFound = true;
        return; // Skip the main title
      }
      
      // Check if it's a section heading (## heading)
      if (line.startsWith('## ')) {
        // Save the previous section if it has points
        if (currentSection.points.length > 0) {
          processedSections.push({...currentSection});
        }
        
        // Determine section type based on content
        const sectionTitle = line.replace(/^## /, '');
        let sectionType = 'default';
        
        if (sectionTitle.includes('Revenue') || sectionTitle.includes('Sales') || sectionTitle.includes('💰')) {
          sectionType = 'revenue';
        } else if (sectionTitle.includes('Product') || sectionTitle.includes('Time') || sectionTitle.includes('🏆')) {
          sectionType = 'product';
        } else if (sectionTitle.includes('Business') || sectionTitle.includes('Growth') || sectionTitle.includes('💼')) {
          sectionType = 'business';
        } else if (sectionTitle.includes('Performance') || sectionTitle.includes('Accelerators') || sectionTitle.includes('🚀')) {
          sectionType = 'performance';
        }
        
        // Start a new section
        currentSection = {
          title: sectionTitle,
          type: sectionType,
          points: []
        };
      } 
      // Check if it's a subsection heading (bold text that's not a bullet point)
      else if (line.includes('**') && !line.startsWith('*')) {
        currentSection.points.push({
          text: line,
          isHeader: true
        });
      }
      // Otherwise it's a regular point
      else {
        currentSection.points.push({
          text: line,
          isHeader: false
        });
      }
    });
    
    // Add the last section
    if (currentSection.points.length > 0) {
      processedSections.push(currentSection);
    }
    
    setSections(processedSections);
  }, [summary, generatedSummary]);

  // Function to generate a basic summary from data for client-side use
  const generateBasicSummary = (data: any[], statistics: any): string => {
    // Create a reasonably structured summary with sections for different insight types
    let generatedSummary = "# Business Insights from Your Data\n\n";
    
    // 1. Revenue/Value Insights
    generatedSummary += "## 💰 Revenue Opportunities\n\n";
    
    // Check if we have numeric columns that might represent revenue
    const numericColumns = Object.keys(statistics?.numeric_columns || {});
    if (numericColumns.length > 0) {
      const valueCol = numericColumns[0];
      const stats = statistics.numeric_columns[valueCol];
      
      // Add revenue-related insights
      generatedSummary += `**Value Distribution Analysis:** Your ${valueCol} shows an average of ${stats.mean.toFixed(2)}, with a range from ${stats.min} to ${stats.max}.\n\n`;
      
      const variability = stats.std / stats.mean;
      if (variability > 0.5) {
        generatedSummary += `**High Variability Alert:** There's significant variation in your ${valueCol} (${(variability * 100).toFixed(0)}% of mean). Consider implementing segmented pricing strategies or investigating outliers.\n\n`;
      } else {
        generatedSummary += `**Revenue Optimization:** Your ${valueCol} values are relatively consistent. Focus on gradually increasing your average transaction value through upselling strategies.\n\n`;
      }
    } else {
      generatedSummary += "**Revenue Potential:** Add transaction value data to get specific revenue enhancement recommendations.\n\n";
    }
    
    // 2. Product Insights
    generatedSummary += "## 🏆 Product Performance\n\n";
    
    // Check for categorical columns that might represent products
    const categoricalColumns = Object.keys(statistics?.categorical_columns || {});
    const productLikeColumns = categoricalColumns.filter(col => 
      col.toLowerCase().includes('product') || 
      col.toLowerCase().includes('item') || 
      col.toLowerCase() === 'good'
    );
    
    if (productLikeColumns.length > 0) {
      const productCol = productLikeColumns[0];
      const stats = statistics.categorical_columns[productCol];
      
      generatedSummary += `**Top Performer:** "${stats.most_common}" is your best-selling ${productCol} with ${stats.frequency} units sold.\n\n`;
      generatedSummary += `**Product Mix Optimization:** You have ${stats.unique_values} different ${productCol}s. Consider consolidating low-performers and investing more in your top products.\n\n`;
    } else if (categoricalColumns.length > 0) {
      const firstCatCol = categoricalColumns[0];
      const stats = statistics.categorical_columns[firstCatCol];
      
      generatedSummary += `**Category Distribution:** Your top ${firstCatCol} is "${stats.most_common}" representing ${((stats.frequency / data.length) * 100).toFixed(1)}% of your data.\n\n`;
    } else {
      generatedSummary += "**Product Strategy:** Add product data to receive specific product optimization insights.\n\n";
    }
    
    // 3. Business Strategy Insights
    generatedSummary += "## 💼 Business Strategies\n\n";
    
    // Check for time patterns
    if (statistics?.time_patterns) {
      const patterns = statistics.time_patterns;
      const timeUnit = Object.keys(patterns)[0]; // hourly, daily, etc.
      if (timeUnit && patterns[timeUnit]) {
        const timeData = patterns[timeUnit];
        const maxKey = Object.keys(timeData).reduce((a, b) => timeData[a] > timeData[b] ? a : b);
        const minKey = Object.keys(timeData).reduce((a, b) => timeData[a] < timeData[b] ? a : b);
        
        generatedSummary += `**Operational Timing:** Your peak activity is on ${maxKey} while ${minKey} shows the lowest activity. Consider optimizing staff and resources accordingly.\n\n`;
      }
    }
    
    // Add associations if available
    if (statistics?.product_associations) {
      generatedSummary += "**Cross-Selling Opportunities:** Your data shows product associations that can be leveraged for bundling and cross-selling strategies.\n\n";
    }
    
    // 4. Performance Accelerators
    generatedSummary += "## 🚀 Performance Accelerators\n\n";
    
    // Check for data quality issues
    if (statistics?.data_quality) {
      const quality = statistics.data_quality;
      if (quality.overall_score < 80) {
        generatedSummary += `**Data Quality Focus:** Improving your data quality (currently at ${quality.overall_score}%) will enhance the accuracy of business insights.\n\n`;
      } else {
        generatedSummary += `**Strong Data Foundation:** Your data quality score of ${quality.overall_score}% provides a solid foundation for decision-making.\n\n`;
      }
    }
    
    // Generic recommendations
    generatedSummary += "**Action Steps:** Review these insights with your team and prioritize 2-3 specific initiatives for immediate implementation.\n\n";
    
    return generatedSummary;
  };

  const formatText = (text: string) => {
    // Replace markdown bold with spans
    return text.replace(/\*\*(.*?)\*\*/g, '<span class="font-semibold text-slate-900">$1</span>');
  };

  return (
    <div className="space-y-6">
      {sections.length > 0 ? (
        <>
          <div className="text-sm text-slate-500 mb-4">
            Our AI has analyzed your data and identified these key business insights:
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {sections.map((section, index) => {
              const colors = sectionColors[section.type];
              const icon = icons[section.type] || icons.default;
              
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
                      {section.title.replace(/^#+\s*/, '').replace(/[💰🏆💼🚀📈]/g, '')}
                    </h3>
                  </div>
                  
                  <div className="bg-white p-5">
                    <div className="space-y-4">
                      {section.points.map((point, pointIndex) => {
                        if (point.isHeader) {
                          // It's a subsection header
                          return (
                            <div key={pointIndex} className="pt-2 pb-1">
                              <h4 className="text-base font-semibold text-slate-800" 
                                dangerouslySetInnerHTML={{ __html: formatText(point.text) }} />
                            </div>
                          );
                        } else {
                          // It's a regular point
                          return (
                            <div key={pointIndex} className="ml-1 flex items-start">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 mr-2 flex-shrink-0"></div>
                              <div 
                                className="text-sm text-slate-600"
                                dangerouslySetInnerHTML={{ __html: formatText(point.text) }}
                              />
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          {(data && data.length > 0) ? 
            "Analyzing your data to generate insights..." : 
            "Upload data to generate business insights"}
        </div>
      )}
    </div>
  );
}
