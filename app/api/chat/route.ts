import { NextRequest, NextResponse } from "next/server"

interface ChatRequest {
  question: string;
  data: any[];
  statistics: any;
  context?: {
    recentTopics: string[];
    mentionedColumns: string[];
    lastQuestion?: string;
    preferredVisualization?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json() as ChatRequest;
    
    // Extract the question, data and context
    const { question, data, statistics, context } = body;
    
    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }
    
    if (!data || !data.length) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }
    
    // Generate an answer based on the question, data and context
    const answer = generateAnswer(question, data, statistics, context);
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error processing chat request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function generateAnswer(
  question: string, 
  data: any[], 
  statistics: any, 
  context?: ChatRequest['context']
): string {
  const lowerQuestion = question.toLowerCase();
  
  // Get column names from the first data row
  const columns = Object.keys(data[0] || {});
  
  // Use context to enhance the response if available
  const isFollowUpQuestion = context?.lastQuestion && 
    (lowerQuestion.includes('it') || 
     lowerQuestion.includes('this') || 
     lowerQuestion.includes('they') || 
     lowerQuestion.includes('those') ||
     lowerQuestion.length < 15);
  
  // Handle follow-up questions
  if (isFollowUpQuestion && context?.lastQuestion) {
    // Reference previous context for follow-up questions
    const previousQuestion = context.lastQuestion.toLowerCase();
    
    // Check if this is a follow-up to a specific column
    if (context.mentionedColumns.length > 0) {
      const lastMentionedColumn = context.mentionedColumns[0];
      
      // If the previous question was about a column, and this one is a follow-up
      if (previousQuestion.includes(lastMentionedColumn.toLowerCase()) && 
          (lowerQuestion.includes('why') || lowerQuestion.includes('how') || lowerQuestion.includes('more'))) {
          
        // Enhanced follow-up for column stats
        const isNumeric = statistics?.numeric_columns?.[lastMentionedColumn] !== undefined;
        
        if (isNumeric) {
          const stats = statistics.numeric_columns[lastMentionedColumn];
          
          // Provide deeper insights for follow-up questions
          if (lowerQuestion.includes('why') || lowerQuestion.includes('explain')) {
            const cv = (stats.std / stats.mean * 100).toFixed(1);
            return `The variation in ${lastMentionedColumn} (${cv}% coefficient of variation) might be explained by several factors in your business. This could reflect seasonality, different customer segments, or product mix. I recommend analyzing this metric by time period and customer type to identify patterns.`;
          }
          
          if (lowerQuestion.includes('improve') || lowerQuestion.includes('better')) {
            return `To improve ${lastMentionedColumn} performance, consider targeting the lowest performing segments. Your data shows values as low as ${stats.min}, which is ${((stats.mean - stats.min) / stats.mean * 100).toFixed(1)}% below average. Focus on bringing these up through targeted campaigns or operational improvements.`;
          }
        }
      }
    }
    
    // Check if following up on a previously mentioned topic
    if (context.recentTopics.length > 0) {
      const relevantTopic = context.recentTopics.find(topic => 
        previousQuestion.includes(topic)
      );
      
      if (relevantTopic) {
        if (relevantTopic === 'correlation' || relevantTopic === 'related') {
          return `Looking deeper at the correlations in your data, I notice that some relationships might be indicating underlying business patterns. For example, customer segments with higher purchase frequency tend to have different product preferences. You may want to explore creating targeted bundles for these segments.`;
        }
        
        if (relevantTopic === 'trend' || relevantTopic === 'pattern') {
          return `Examining your trends more closely, I can see that the patterns aren't just random fluctuations - they likely represent real business cycles. Consider how external factors like marketing campaigns, seasonal events, or market conditions might be influencing these patterns.`;
        }
      }
    }
  }
  
  // Check for basic statistical questions
  if (lowerQuestion.includes("how many rows") || lowerQuestion.includes("how many records")) {
    return `There are ${data.length} records in the dataset.`;
  }
  
  if (lowerQuestion.includes("what columns") || lowerQuestion.includes("what fields")) {
    return `The dataset contains the following columns: ${columns.join(", ")}.`;
  }
  
  // Enhanced trend detection
  if (lowerQuestion.includes("trend") || lowerQuestion.includes("pattern") || 
      lowerQuestion.includes("growing") || lowerQuestion.includes("declining")) {
    return detectTrends(data, statistics);
  }
  
  // Enhanced outlier detection
  if (lowerQuestion.includes("unusual") || lowerQuestion.includes("outlier") || 
      lowerQuestion.includes("anomaly") || lowerQuestion.includes("strange")) {
    return detectOutliers(data, statistics);
  }
  
  // Check for column-specific questions
  for (const column of columns) {
    const lowerColumn = column.toLowerCase();
    
    if (lowerQuestion.includes(lowerColumn)) {
      // If we're asking about a specific column
      const isNumeric = statistics?.numeric_columns?.[column] !== undefined;
      
      if (isNumeric) {
        const stats = statistics.numeric_columns[column];
        
        if (lowerQuestion.includes("average") || lowerQuestion.includes("mean")) {
          return `The average ${column} is ${stats.mean.toFixed(2)}.`;
        }
        
        if (lowerQuestion.includes("maximum") || lowerQuestion.includes("highest")) {
          const percentDiff = ((stats.max - stats.mean) / stats.mean * 100).toFixed(1);
          return `The maximum ${column} is ${stats.max}, which is ${percentDiff}% above the average. ${getBusinessInsight(column, "max")}`;
        }
        
        if (lowerQuestion.includes("minimum") || lowerQuestion.includes("lowest")) {
          const percentDiff = ((stats.mean - stats.min) / stats.mean * 100).toFixed(1);
          return `The minimum ${column} is ${stats.min}, which is ${percentDiff}% below the average. ${getBusinessInsight(column, "min")}`;
        }
        
        if (lowerQuestion.includes("distribution") || lowerQuestion.includes("spread")) {
          const variance = stats.std * stats.std;
          const cv = (stats.std / stats.mean * 100).toFixed(1);
          return `The ${column} data has a standard deviation of ${stats.std.toFixed(2)} with a coefficient of variation of ${cv}%. ${getBusinessInsight(column, "distribution")}`;
        }
        
        // Default stats for numeric column with business context
        return `For ${column}: The average is ${stats.mean.toFixed(2)}, ranging from ${stats.min} to ${stats.max}. ${getBusinessInsight(column, "general")}`;
      } else {
        // It's a categorical column
        const cats = statistics?.categorical_columns?.[column];
        if (cats) {
          const topPercentage = (cats.frequency / data.length * 100).toFixed(1);
          
          if (lowerQuestion.includes("distribution") || lowerQuestion.includes("breakdown")) {
            return `For ${column}: There are ${cats.unique_values} unique values. "${cats.most_common}" represents ${topPercentage}% of the data. ${getCategoricalInsight(column, cats)}`;
          }
          
          return `For ${column}: There are ${cats.unique_values} unique values, with "${cats.most_common}" being the most common (appears ${cats.frequency} times, ${topPercentage}% of data).`;
        }
      }
    }
  }
  
  // Check for correlation questions
  if (lowerQuestion.includes("correlation") || lowerQuestion.includes("related")) {
    // Find numeric columns that have the strongest correlation
    const corrData = statistics?.correlations;
    if (corrData) {
      const numericColumns = Object.keys(corrData);
      let highestCorr = 0;
      let col1 = "";
      let col2 = "";
      
      for (let i = 0; i < numericColumns.length; i++) {
        const c1 = numericColumns[i];
        for (let j = i + 1; j < numericColumns.length; j++) {
          const c2 = numericColumns[j];
          const corrValue = Math.abs(corrData[c1][c2]);
          
          if (corrValue > highestCorr && corrValue < 1) { // Exclude self-correlations
            highestCorr = corrValue;
            col1 = c1;
            col2 = c2;
          }
        }
      }
      
      if (col1 && col2) {
        const corrSign = corrData[col1][col2] > 0 ? "positive" : "negative";
        let insight = "";
        
        if (highestCorr > 0.7) {
          insight = `This indicates a strong relationship that could be leveraged for business decisions.`;
        } else if (highestCorr > 0.4) {
          insight = `This suggests a moderate relationship worth exploring further.`;
        } else {
          insight = `This shows a weak relationship, but might still offer some insights.`;
        }
        
        return `The strongest correlation is between ${col1} and ${col2} with a ${corrSign} correlation of ${corrData[col1][col2].toFixed(2)}. ${insight}`;
      }
    }
  }
  
  // Check for time pattern questions with improved responses
  if (lowerQuestion.includes("time pattern") || lowerQuestion.includes("trend") || 
      lowerQuestion.includes("over time") || lowerQuestion.includes("seasonal")) {
    if (statistics?.time_patterns && Object.keys(statistics.time_patterns).length > 0) {
      const patterns = statistics.time_patterns;
      const timeUnit = Object.keys(patterns)[0];
      const values = patterns[timeUnit];
      
      // Find peak time
      const maxKey = Object.keys(values).reduce((a, b) => values[a] > values[b] ? a : b);
      
      // Find slowest time
      const minKey = Object.keys(values).reduce((a, b) => values[a] < values[b] ? a : b);
      
      // Calculate the spread
      const maxVal = values[maxKey];
      const minVal = values[minKey];
      const spread = ((maxVal - minVal) / minVal * 100).toFixed(0);
      
      let timeInsight = "";
      if (parseInt(spread) > 100) {
        timeInsight = `This represents a significant ${timeUnit} variation of ${spread}% between peak and slowest periods.`;
      } else if (parseInt(spread) > 50) {
        timeInsight = `This shows moderate ${timeUnit} variation that could be leveraged for scheduling and resource allocation.`;
      } else {
        timeInsight = `Your business has relatively consistent demand across different ${timeUnit} periods.`;
      }
      
      return `The data shows peak activity on ${maxKey} with ${values[maxKey]} records, while ${minKey} is your slowest period with ${values[minKey]} records. ${timeInsight}`;
    }
  }
  
  // Add a new section for data quality questions after the time pattern questions
  if (lowerQuestion.includes("quality") || lowerQuestion.includes("missing") || 
      lowerQuestion.includes("data issue") || lowerQuestion.includes("problem") ||
      lowerQuestion.includes("reliability") || lowerQuestion.includes("accuracy")) {
    
    if (statistics?.data_quality) {
      const quality = statistics.data_quality;
      
      // Overall quality score and rating
      let response = `Your data quality score is ${quality.overall_score}% (${quality.rating}). `;
      
      // Missing values
      if (quality.missing_values && quality.missing_values.percentage > 0) {
        response += `${quality.missing_values.percentage}% of your data has missing values. `;
      }
      
      // Column-specific issues
      if (quality.column_issues && quality.column_issues.length > 0) {
        const issueCount = quality.column_issues.length;
        response += `I found issues in ${issueCount} column${issueCount > 1 ? 's' : ''}. `;
        
        // Mention the top issue
        const topIssue = quality.column_issues[0];
        response += `Most notably, the "${topIssue.column}" column has ${topIssue.issue_type} (${topIssue.percentage}% of values). `;
      }
      
      // Add recommendations based on quality score
      if (quality.overall_score < 60) {
        response += "\n\nYour data has significant quality issues that could affect the reliability of insights. ";
        
        if (quality.recommendations && quality.recommendations.length > 0) {
          response += "I recommend:\n";
          quality.recommendations.slice(0, 3).forEach((rec: string) => {
            response += `- ${rec}\n`;
          });
        }
      } else if (quality.overall_score < 80) {
        response += "\n\nYour data has some quality issues that could affect certain analyses. ";
        
        if (quality.recommendations && quality.recommendations.length > 0) {
          response += "Consider addressing these issues:\n";
          quality.recommendations.slice(0, 2).forEach((rec: string) => {
            response += `- ${rec}\n`;
          });
        }
      } else {
        response += "\n\nYour data quality is generally good, but there's still room for improvement. ";
        
        if (quality.recommendations && quality.recommendations.length > 0) {
          response += `One tip: ${quality.recommendations[0]}`;
        }
      }
      
      // Suggest viewing the data quality tab
      response += "\n\nYou can view more detailed quality metrics in the 'Data Quality' tab of the visualizer.";
      
      return response;
    } else {
      return "I don't have detailed data quality information for this dataset. Consider using tools like data profiling or validation to check for issues like missing values, outliers, or inconsistent formats.";
    }
  }
  
  // Handle specific questions about missing data
  if (lowerQuestion.includes("missing") || lowerQuestion.includes("empty") || 
      lowerQuestion.includes("null") || lowerQuestion.includes("na values")) {
    
    if (statistics?.data_quality?.missing_values) {
      const missing = statistics.data_quality.missing_values;
      
      let response = `Your dataset has ${missing.percentage}% missing values overall. `;
      
      if (missing.columns && missing.columns.length > 0) {
        response += "Columns with the most missing values:\n";
        
        missing.columns.slice(0, 3).forEach((col: { name: string; percentage: number }) => {
          response += `- ${col.name}: ${col.percentage}% missing\n`;
        });
        
        // Add business impact
        response += "\nMissing values can impact your analysis by:";
        response += "\n- Creating biased insights if data isn't missing randomly";
        response += "\n- Reducing statistical power for correlation and trend analysis";
        response += "\n- Potentially omitting important segments or time periods";
        
        // Add recommendations
        if (missing.percentage > 20) {
          response += "\n\nI recommend addressing these missing values before making major business decisions based on this data.";
        } else if (missing.percentage > 5) {
          response += "\n\nConsider using imputation techniques or filtering strategies when analyzing the affected columns.";
        } else {
          response += "\n\nThe level of missing data is low enough that it shouldn't significantly impact most analyses.";
        }
      }
      
      return response;
    }
  }
  
  // Handle questions about outliers in the data
  if (lowerQuestion.includes("outlier") || lowerQuestion.includes("extreme value") || 
      lowerQuestion.includes("anomaly") || lowerQuestion.includes("unusual")) {
    
    if (statistics?.data_quality?.outliers) {
      const outliers = statistics.data_quality.outliers;
      
      let response = `I detected ${outliers.count} outliers across ${outliers.columns_affected} columns in your data. `;
      
      if (outliers.details && outliers.details.length > 0) {
        response += "Notable outliers:\n";
        
        outliers.details.slice(0, 3).forEach((detail: { column: string; direction: string; threshold: number; percentage: number }) => {
          response += `- ${detail.column}: Values ${detail.direction === 'high' ? 'above' : 'below'} ${detail.threshold} (${detail.percentage}% of values)\n`;
        });
        
        // Add business context
        response += "\nOutliers can represent:";
        response += "\n- Data entry errors that should be corrected";
        response += "\n- Legitimate but unusual business events worth investigating";
        response += "\n- Opportunities (extremely high sales) or problems (extreme delays)";
        
        // Add recommendations
        response += "\n\nWhen analyzing this data, consider examining these outliers separately to understand their impact on your overall metrics.";
      }
      
      return response;
    }
  }
  
  // Business insights with actionable advice
  if (lowerQuestion.includes("insight") || lowerQuestion.includes("suggest") || 
      lowerQuestion.includes("recommend") || lowerQuestion.includes("improve")) {
    
    // Get numeric columns for revenue/value insights
    const numericCols = Object.keys(statistics?.numeric_columns || {});
    const categoricalCols = Object.keys(statistics?.categorical_columns || {});
    
    let insights = "Based on your data analysis:\n\n";
    
    // Revenue-related insights
    if (numericCols.length > 0) {
      const valueCol = numericCols[0];
      const stats = statistics.numeric_columns[valueCol];
      const variability = stats.std / stats.mean;
      
      if (variability > 0.5) {
        insights += `1. Your ${valueCol} shows high variability (${(variability * 100).toFixed(0)}% of mean). Consider implementing more consistent pricing or service delivery strategies.\n\n`;
      } else {
        insights += `1. Your ${valueCol} shows good consistency. Focus on gradually increasing your average transaction value.\n\n`;
      }
    }
    
    // Time-related insights
    if (statistics?.time_patterns) {
      const patterns = statistics.time_patterns;
      if (patterns.daily) {
        const dailyValues = patterns.daily;
        const maxDay = Object.keys(dailyValues).reduce((a, b) => dailyValues[a] > dailyValues[b] ? a : b);
        const minDay = Object.keys(dailyValues).reduce((a, b) => dailyValues[a] < dailyValues[b] ? a : b);
        
        insights += `2. Your business performs best on ${maxDay} and worst on ${minDay}. Consider running promotions on ${minDay} to balance demand.\n\n`;
      }
    }
    
    // Product mix insights
    if (categoricalCols.length > 0) {
      const productLikeColumns = categoricalCols.filter(col => 
        col.toLowerCase().includes('product') || 
        col.toLowerCase().includes('item') || 
        col.toLowerCase() === 'good'
      );
      
      if (productLikeColumns.length > 0) {
        const productCol = productLikeColumns[0];
        const stats = statistics.categorical_columns[productCol];
        
        insights += `3. "${stats.most_common}" is your top performer. Consider creating bundles with this product or developing premium versions to increase revenue.\n\n`;
      }
    }
    
    // Add generic advice if we couldn't generate specific insights
    if (insights === "Based on your data analysis:\n\n") {
      insights += "To get more specific insights, consider adding more detailed transaction data including dates, product information, and customer segments.";
    }
    
    return insights;
  }
  
  // Default response with context awareness
  const hasContext = context && (context.recentTopics.length > 0 || context.mentionedColumns.length > 0);
  
  if (hasContext) {
    // Provide a more tailored response based on conversation history
    const topicSuggestion = context?.recentTopics[0] 
      ? `You've shown interest in ${context.recentTopics[0]}. Try asking more specific questions about this.` 
      : '';
      
    const columnSuggestion = context?.mentionedColumns[0] 
      ? `For more insights on ${context.mentionedColumns[0]}, ask about trends, distributions, or correlations.` 
      : '';
      
    return `Based on the analyzed data with ${columns.length} fields and ${data.length} records, I can see some patterns. ${topicSuggestion} ${columnSuggestion}`;
  }
  
  return `Based on the analyzed data with ${columns.length} fields and ${data.length} records, I can see some patterns. To get more specific insights, try asking about a particular column, correlations, time patterns, or product associations.`;
}

// Helper function to detect trends in the data
function detectTrends(data: any[], statistics: any): string {
  const numericColumns = Object.keys(statistics?.numeric_columns || {});
  
  if (numericColumns.length === 0) {
    return "I don't see any clear numeric trends in your data. Consider adding more numeric fields for trend analysis.";
  }
  
  // Use the first numeric column for trend analysis
  const column = numericColumns[0];
  const stats = statistics.numeric_columns[column];
  
  // Simple trend detection by comparing first and last quarter of data
  const quarterSize = Math.floor(data.length / 4);
  if (quarterSize < 2) {
    return "Not enough data points to detect reliable trends.";
  }
  
  const firstQuarter = data.slice(0, quarterSize);
  const lastQuarter = data.slice(data.length - quarterSize);
  
  // Calculate averages for first and last quarters
  const firstAvg = firstQuarter.reduce((sum, row) => sum + Number(row[column]), 0) / firstQuarter.length;
  const lastAvg = lastQuarter.reduce((sum, row) => sum + Number(row[column]), 0) / lastQuarter.length;
  
  // Calculate percent change
  const percentChange = ((lastAvg - firstAvg) / firstAvg * 100).toFixed(1);
  const absChange = Math.abs(parseFloat(percentChange));
  
  if (absChange < 5) {
    return `Your ${column} values are relatively stable with only a ${percentChange}% change between the beginning and end of your dataset.`;
  } else if (lastAvg > firstAvg) {
    return `I've detected an upward trend of ${percentChange}% in your ${column} values from the beginning to the end of your dataset. This suggests growth in this metric over the recorded period.`;
  } else {
    return `I've detected a downward trend of ${percentChange}% in your ${column} values from the beginning to the end of your dataset. This suggests a decline in this metric that may warrant investigation.`;
  }
}

// Helper function to detect outliers
function detectOutliers(data: any[], statistics: any): string {
  const numericColumns = Object.keys(statistics?.numeric_columns || {});
  
  if (numericColumns.length === 0) {
    return "I don't see any clear outliers in your data. Consider adding more numeric fields for outlier detection.";
  }
  
  // Check all numeric columns for outliers
  const outliers: Record<string, any[]> = {};
  
  numericColumns.forEach(column => {
    const stats = statistics.numeric_columns[column];
    const threshold = stats.mean + 2 * stats.std; // Values above 2 standard deviations
    
    // Find outlier values
    const columnOutliers = data
      .filter(row => Number(row[column]) > threshold)
      .slice(0, 3); // Limit to top 3
    
    if (columnOutliers.length > 0) {
      outliers[column] = columnOutliers.map(row => Number(row[column]));
    }
  });
  
  if (Object.keys(outliers).length === 0) {
    return "I don't detect any significant outliers in your numeric data.";
  }
  
  // Format response
  let response = "I've detected these unusual values in your data:\n\n";
  
  Object.entries(outliers).forEach(([column, values]) => {
    const stats = statistics.numeric_columns[column];
    const avgStr = stats.mean.toFixed(2);
    const valuesStr = values.map(v => v.toFixed(2)).join(", ");
    const pctAbove = ((values[0] - stats.mean) / stats.mean * 100).toFixed(0);
    
    response += `${column}: Values of ${valuesStr} are unusually high (average is ${avgStr}). The highest is ${pctAbove}% above average.\n\n`;
  });
  
  response += "These outliers could represent special cases or errors in your data.";
  return response;
}

// Helper to generate business insights for numeric columns
function getBusinessInsight(column: string, type: string): string {
  const colLower = column.toLowerCase();
  
  // Revenue-related insights
  if (colLower.includes('revenue') || colLower.includes('sales') || colLower.includes('price')) {
    if (type === "max") {
      return "This maximum represents your best-performing transactions. Analyzing what drove these high-value sales could help replicate their success.";
    } else if (type === "min") {
      return "These minimum values may represent opportunities to implement minimum order values or bundle offers to increase transaction size.";
    } else if (type === "distribution") {
      return "Understanding this variation can help you develop more consistent pricing and sales strategies.";
    } else {
      return "Focus on strategies to increase your average transaction value for the most impact on overall revenue.";
    }
  }
  
  // Quantity-related insights
  if (colLower.includes('quantity') || colLower.includes('units') || colLower.includes('count')) {
    if (type === "max") {
      return "These maximum quantities may represent bulk order opportunities or institutional customers.";
    } else if (type === "min") {
      return "Single-unit purchases could be opportunities for cross-selling or bundle promotion.";
    } else if (type === "distribution") {
      return "Understanding order size patterns can help optimize inventory management and packaging strategies.";
    } else {
      return "Strategies to increase units per transaction can significantly impact revenue without requiring new customers.";
    }
  }
  
  // Generic business insights
  if (type === "max") {
    return "Analyzing what drives these peak values could reveal important business opportunities.";
  } else if (type === "min") {
    return "Understanding these minimum values can help establish effective baseline metrics.";
  } else if (type === "distribution") {
    return "Monitoring this variation over time can help identify changes in your business patterns.";
  } else {
    return "Tracking these metrics over time will help identify important business trends.";
  }
}

// Helper for categorical column insights
function getCategoricalInsight(column: string, stats: any): string {
  const colLower = column.toLowerCase();
  
  // Product-related insights
  if (colLower.includes('product') || colLower.includes('item') || colLower.includes('sku')) {
    if (stats.unique_values < 5) {
      return "Your limited product range suggests an opportunity to expand offerings.";
    } else if (stats.frequency > stats.unique_values * 2) {
      return "Your sales are heavily concentrated on a few top products. Consider diversification strategies.";
    } else {
      return "Your product mix shows balanced performance across categories.";
    }
  }
  
  // Customer-related insights
  if (colLower.includes('customer') || colLower.includes('client') || colLower.includes('segment')) {
    if (stats.unique_values < 5) {
      return "Your customer base shows clear segmentation which can be used for targeted marketing.";
    } else if (stats.frequency > stats.unique_values * 2) {
      return "You have a dominant customer segment. Consider both retention strategies and diversification.";
    } else {
      return "Your diverse customer base provides resilience but may benefit from more targeted approaches.";
    }
  }
  
  // Time-related insights
  if (colLower.includes('day') || colLower.includes('month') || colLower.includes('period')) {
    return "Understanding these temporal patterns can help optimize staffing and operational planning.";
  }
  
  return "This distribution shows where your business activity concentrates.";
} 