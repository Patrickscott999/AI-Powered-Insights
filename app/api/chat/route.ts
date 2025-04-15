import { NextRequest, NextResponse } from "next/server"

interface ChatRequest {
  question: string;
  data: any[];
  statistics: any;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json() as ChatRequest;
    
    // Extract the question and data
    const { question, data, statistics } = body;
    
    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }
    
    if (!data || !data.length) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }
    
    // Generate an answer based on the question and data
    const answer = generateAnswer(question, data, statistics);
    
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Error processing chat request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

function generateAnswer(question: string, data: any[], statistics: any): string {
  // Simplified answer generation - in a real application, you might use a more sophisticated
  // approach or even an external API/AI service
  
  const lowerQuestion = question.toLowerCase();
  
  // Get column names from the first data row
  const columns = Object.keys(data[0] || {});
  
  // Check for basic statistical questions
  if (lowerQuestion.includes("how many rows") || lowerQuestion.includes("how many records")) {
    return `There are ${data.length} records in the dataset.`;
  }
  
  if (lowerQuestion.includes("what columns") || lowerQuestion.includes("what fields")) {
    return `The dataset contains the following columns: ${columns.join(", ")}.`;
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
          return `The maximum ${column} is ${stats.max}.`;
        }
        
        if (lowerQuestion.includes("minimum") || lowerQuestion.includes("lowest")) {
          return `The minimum ${column} is ${stats.min}.`;
        }
        
        // Default stats for numeric column
        return `For ${column}: The average is ${stats.mean.toFixed(2)}, ranging from ${stats.min} to ${stats.max}.`;
      } else {
        // It's a categorical column
        const cats = statistics?.categorical_columns?.[column];
        if (cats) {
          return `For ${column}: There are ${cats.unique_values} unique values, with "${cats.most_common}" being the most common (appears ${cats.frequency} times).`;
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
        return `The strongest correlation is between ${col1} and ${col2} with a ${corrSign} correlation of ${corrData[col1][col2].toFixed(2)}.`;
      }
    }
  }
  
  // Check for time pattern questions
  if (lowerQuestion.includes("time pattern") || lowerQuestion.includes("trend") || 
      lowerQuestion.includes("over time") || lowerQuestion.includes("seasonal")) {
    if (statistics?.time_patterns && Object.keys(statistics.time_patterns).length > 0) {
      const patterns = statistics.time_patterns;
      const timeUnit = Object.keys(patterns)[0];
      const values = patterns[timeUnit];
      const maxKey = Object.keys(values).reduce((a, b) => values[a] > values[b] ? a : b);
      
      return `The data shows peak activity on ${maxKey} with ${values[maxKey]} records. The overall pattern suggests ${timeUnit === 'hour' ? 'hourly' : timeUnit} trends.`;
    }
  }
  
  // Check for product association questions
  if (lowerQuestion.includes("product") && 
      (lowerQuestion.includes("association") || lowerQuestion.includes("together") || 
       lowerQuestion.includes("frequently") || lowerQuestion.includes("related"))) {
    if (statistics?.product_associations) {
      const associations = statistics.product_associations;
      const productName = Object.keys(associations)[0];
      if (productName && associations[productName].length > 0) {
        const topAssociation = associations[productName][0];
        return `Products frequently bought with "${productName}" include "${topAssociation[0]}" with a co-occurrence rate of ${(topAssociation[1] * 100).toFixed(1)}%.`;
      }
    }
  }
  
  // Check for business insights
  if (lowerQuestion.includes("insight") || lowerQuestion.includes("suggest") || 
      lowerQuestion.includes("recommend") || lowerQuestion.includes("improve")) {
    return "Based on the data patterns, I recommend focusing on optimizing your highest revenue streams and identifying potential growth areas among your top-performing products.";
  }
  
  // Sample response for questions we don't specifically handle
  return `Based on the analyzed data with ${columns.length} fields and ${data.length} records, I can see some patterns. To get more specific insights, try asking about a particular column, correlations, time patterns, or product associations.`;
} 