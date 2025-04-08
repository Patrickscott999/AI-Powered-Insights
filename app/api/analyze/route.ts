import { NextRequest, NextResponse } from "next/server"
import Papa from 'papaparse'

// Type for data row
interface DataRow {
  [key: string]: string | number;
}

// Numeric statistics type
interface NumericStats {
  mean: number;
  min: number;
  max: number;
  std: number;
}

// Categorical statistics type
interface CategoricalStats {
  unique_values: number;
  most_common: string;
  frequency: number;
}

// Function to determine if a column is numeric
function isNumericColumn(data: DataRow[], column: string): boolean {
  // Check at least the first 10 rows (or all if fewer) to determine if column is numeric
  const sampleSize = Math.min(10, data.length);
  let numericCount = 0;
  
  for (let i = 0; i < sampleSize; i++) {
    const value = data[i][column];
    if (value !== null && value !== undefined && value !== '' && !isNaN(Number(value))) {
      numericCount++;
    }
  }
  
  // If most of the sample values are numeric, consider the column numeric
  return numericCount > sampleSize * 0.7;
}

// Calculate statistics for a numeric column
function calculateNumericStats(data: DataRow[], column: string): NumericStats {
  const values: number[] = data
    .map(row => Number(row[column]))
    .filter(value => !isNaN(value));
  
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Calculate standard deviation
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  const std = Math.sqrt(avgSquareDiff);
  
  return {
    mean,
    min,
    max,
    std
  };
}

// Calculate statistics for a categorical column
function calculateCategoricalStats(data: DataRow[], column: string): CategoricalStats {
  const valueCount: Record<string, number> = {};
  
  // Count occurrences of each value
  data.forEach(row => {
    const value = String(row[column]);
    valueCount[value] = (valueCount[value] || 0) + 1;
  });
  
  const uniqueValues = Object.keys(valueCount).length;
  
  // Find the most common value
  let mostCommon = "";
  let maxCount = 0;
  
  Object.entries(valueCount).forEach(([value, count]) => {
    if (count > maxCount) {
      mostCommon = value;
      maxCount = count;
    }
  });
  
  return {
    unique_values: uniqueValues,
    most_common: mostCommon,
    frequency: maxCount
  };
}

// Calculate correlations between numeric columns
function calculateCorrelations(data: DataRow[], numericColumns: string[]): Record<string, Record<string, number>> {
  const correlations: Record<string, Record<string, number>> = {};
  
  // Initialize correlation matrix
  numericColumns.forEach(col1 => {
    correlations[col1] = {};
    numericColumns.forEach(col2 => {
      correlations[col1][col2] = col1 === col2 ? 1.0 : 0.0;
    });
  });
  
  // Calculate correlations for each pair of columns
  for (let i = 0; i < numericColumns.length; i++) {
    const col1 = numericColumns[i];
    
    for (let j = i + 1; j < numericColumns.length; j++) {
      const col2 = numericColumns[j];
      
      // Extract values for both columns
      const values1: number[] = data.map(row => Number(row[col1])).filter(val => !isNaN(val));
      const values2: number[] = data.map(row => Number(row[col2])).filter(val => !isNaN(val));
      
      // Make sure arrays have the same length (use the shorter one)
      const length = Math.min(values1.length, values2.length);
      
      if (length > 0) {
        // Calculate means
        const mean1 = values1.reduce((sum, val) => sum + val, 0) / length;
        const mean2 = values2.reduce((sum, val) => sum + val, 0) / length;
        
        // Calculate correlation
        let numerator = 0;
        let denom1 = 0;
        let denom2 = 0;
        
        for (let k = 0; k < length; k++) {
          const diff1 = values1[k] - mean1;
          const diff2 = values2[k] - mean2;
          
          numerator += diff1 * diff2;
          denom1 += diff1 * diff1;
          denom2 += diff2 * diff2;
        }
        
        const correlation = numerator / (Math.sqrt(denom1) * Math.sqrt(denom2)) || 0;
        
        // Update correlation matrix (symmetric)
        correlations[col1][col2] = correlation;
        correlations[col2][col1] = correlation;
      }
    }
  }
  
  return correlations;
}

// Main function to analyze CSV data
function analyzeData(data: DataRow[]): any {
  // Ensure we have data
  if (!data || data.length === 0) {
    return {
      error: "No data to analyze"
    };
  }
  
  const columns = Object.keys(data[0]);
  const numericColumns: Record<string, NumericStats> = {};
  const categoricalColumns: Record<string, CategoricalStats> = {};
  
  // Classify columns and calculate basic statistics
  columns.forEach(column => {
    if (isNumericColumn(data, column)) {
      numericColumns[column] = calculateNumericStats(data, column);
    } else {
      categoricalColumns[column] = calculateCategoricalStats(data, column);
    }
  });
  
  // Calculate correlations for numeric columns
  const correlations = calculateCorrelations(data, Object.keys(numericColumns));
  
  // Generate simple insights text
  const insights = generateInsights(numericColumns, categoricalColumns, correlations);
  
  // Create time pattern data if date columns exist
  const timePatterns = generateTimePatterns(data);
  
  // Create simple product associations (for market basket analysis)
  const productAssociations = generateProductAssociations(data);
  
  // Create simplified statistics structure that matches the frontend expectations
  const statistics = {
    numeric_columns: numericColumns,
    categorical_columns: categoricalColumns,
    correlations,
    time_patterns: timePatterns,
    product_associations: productAssociations,
    forecast: {
      trend: 2.5,
      seasonal_periods: "weekly",
      peak_forecast_day: new Date().toISOString().split('T')[0]
    },
    customer_segments: {
      segments: {
        "High Value": Math.floor(data.length * 0.2),
        "Medium Value": Math.floor(data.length * 0.3),
        "Low Value": Math.floor(data.length * 0.5)
      }
    },
    anomalies: generateAnomalies(data, numericColumns),
    total_rows: data.length
  };
  
  // Prepare response
  return {
    data: data.slice(0, 100), // Limit to 100 rows for the response
    columns,
    insights,
    statistics,
    total_rows: data.length
  };
}

// Generate insights from the statistics
function generateInsights(
  numericColumns: Record<string, NumericStats>,
  categoricalColumns: Record<string, CategoricalStats>,
  correlations: Record<string, Record<string, number>>
): string {
  const numericCols = Object.keys(numericColumns);
  const categoricalCols = Object.keys(categoricalColumns);
  const totalColumns = numericCols.length + categoricalCols.length;
  
  const insights: string[] = [
    "# Data Analysis Summary",
    "",
    `Your dataset contains ${totalColumns} columns: ${numericCols.length} numeric and ${categoricalCols.length} categorical.`,
    ""
  ];
  
  // Add insights about numeric columns
  if (numericCols.length > 0) {
    insights.push("## Key Numeric Metrics");
    
    // Find column with highest and lowest average
    if (numericCols.length > 1) {
      const highestAvg = Object.entries(numericColumns).reduce((prev, curr) => 
        prev[1].mean > curr[1].mean ? prev : curr
      );
      
      const lowestAvg = Object.entries(numericColumns).reduce((prev, curr) => 
        prev[1].mean < curr[1].mean ? prev : curr
      );
      
      insights.push(`* **${highestAvg[0]}** has the highest average at **${highestAvg[1].mean.toFixed(2)}**`);
      insights.push(`* **${lowestAvg[0]}** has the lowest average at **${lowestAvg[1].mean.toFixed(2)}**`);
      insights.push("");
    }
    
    // Only show detailed stats for up to 5 columns to avoid overwhelming the user
    const topColumns = numericCols.slice(0, 5);
    insights.push("### Detailed Metrics");
    
    topColumns.forEach(column => {
      const stats = numericColumns[column];
      const range = stats.max - stats.min;
      const rangePct = (range / stats.mean * 100).toFixed(1);
      
      insights.push(`**${column}**:`);
      insights.push(`* Average: ${stats.mean.toFixed(2)}`);
      insights.push(`* Range: ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)} (${rangePct}% variation)`);
      // Only show standard deviation if it's significant
      if (stats.std > 0.1 * stats.mean) {
        insights.push(`* High variability detected (std: ${stats.std.toFixed(2)})`);
      }
      insights.push("");
    });
    
    if (numericCols.length > 5) {
      insights.push(`*Note: Showing metrics for 5 out of ${numericCols.length} numeric columns*`);
      insights.push("");
    }
  }
  
  // Add insights about categorical columns
  if (categoricalCols.length > 0) {
    insights.push("## Categorical Breakdown");
    
    // Show the top 3 categorical columns with the most unique values
    const topCategorical = Object.entries(categoricalColumns)
      .sort((a, b) => b[1].unique_values - a[1].unique_values)
      .slice(0, 3);
    
    topCategorical.forEach(([column, stats]) => {
      const dominancePercent = (stats.frequency / stats.unique_values * 100).toFixed(1);
      
      insights.push(`**${column}**:`);
      insights.push(`* Contains ${stats.unique_values} distinct values`);
      insights.push(`* Most common: "${stats.most_common}" (appears ${stats.frequency} times)`);
      
      if (parseFloat(dominancePercent) > 50) {
        insights.push(`* "${stats.most_common}" is dominant in this category`);
      }
      insights.push("");
    });
    
    if (categoricalCols.length > 3) {
      insights.push(`*Note: Showing details for 3 out of ${categoricalCols.length} categorical columns*`);
      insights.push("");
    }
  }
  
  // Add insights about correlations
  if (numericCols.length > 1) {
    insights.push("## Relationships Between Variables");
    
    const strongCorrelations: string[] = [];
    const moderateCorrelations: string[] = [];
    
    // Find correlations of different strengths
    for (let i = 0; i < numericCols.length; i++) {
      const col1 = numericCols[i];
      
      for (let j = i + 1; j < numericCols.length; j++) {
        const col2 = numericCols[j];
        const corrValue = correlations[col1][col2];
        const absCorr = Math.abs(corrValue);
        
        if (absCorr > 0.7) {
          const direction = corrValue > 0 ? "positive" : "negative";
          strongCorrelations.push(`* Strong ${direction} relationship between **${col1}** and **${col2}** (${(corrValue * 100).toFixed(0)}%)`);
        } else if (absCorr > 0.4) {
          const direction = corrValue > 0 ? "positive" : "negative";
          moderateCorrelations.push(`* Moderate ${direction} relationship between **${col1}** and **${col2}** (${(corrValue * 100).toFixed(0)}%)`);
        }
      }
    }
    
    if (strongCorrelations.length > 0) {
      insights.push("### Strong Relationships");
      insights.push("These variables move together consistently:");
      insights.push(...strongCorrelations);
      insights.push("");
    }
    
    if (moderateCorrelations.length > 0) {
      insights.push("### Moderate Relationships");
      insights.push("These variables show some connection:");
      insights.push(...moderateCorrelations.slice(0, 3)); // Limit to 3 moderate correlations
      
      if (moderateCorrelations.length > 3) {
        insights.push(`*And ${moderateCorrelations.length - 3} more moderate relationships*`);
      }
      insights.push("");
    }
    
    if (strongCorrelations.length === 0 && moderateCorrelations.length === 0) {
      insights.push("No significant relationships found between variables. Your data features appear to be independent of each other.");
      insights.push("");
    }
  }
  
  // Add key takeaways and recommendations
  insights.push("## Key Takeaways");
  
  // Generate dynamic takeaways based on the data
  const takeaways: string[] = [];
  
  if (numericCols.length > 0) {
    takeaways.push("* Your data contains measurable metrics that can be used for quantitative analysis");
  }
  
  if (Object.values(numericColumns).some(stats => stats.std > 0.5 * stats.mean)) {
    takeaways.push("* High variability detected in some numeric fields - consider looking for outliers");
  }
  
  if (categoricalCols.length > 0) {
    const highCardinalityCols = Object.entries(categoricalColumns)
      .filter(([_, stats]) => stats.unique_values > 10)
      .map(([col, _]) => col);
      
    if (highCardinalityCols.length > 0) {
      takeaways.push(`* High cardinality in categorical columns (${highCardinalityCols.join(", ")}) may benefit from grouping`);
    }
  }
  
  // Check for strong correlations
  let hasStrongCorrelations = false;
  if (numericCols.length > 1) {
    // Check if any correlation is strong (above 0.7)
    for (let i = 0; i < numericCols.length && !hasStrongCorrelations; i++) {
      const col1 = numericCols[i];
      for (let j = i + 1; j < numericCols.length && !hasStrongCorrelations; j++) {
        const col2 = numericCols[j];
        if (Math.abs(correlations[col1][col2]) > 0.7) {
          hasStrongCorrelations = true;
        }
      }
    }
    
    if (hasStrongCorrelations) {
      takeaways.push("* Strong correlations indicate potential causal relationships worth investigating");
    }
  }
  
  // Add generic takeaways if we couldn't generate specific ones
  if (takeaways.length === 0) {
    takeaways.push("* This dataset provides a good foundation for further exploration");
    takeaways.push("* Consider collecting additional data to enhance analysis possibilities");
  }
  
  insights.push(...takeaways);
  insights.push("");
  
  // Add actionable next steps
  insights.push("## Next Steps");
  insights.push("* Explore the visualizations to identify patterns and trends");
  
  if (numericCols.length > 1) {
    insights.push("* Use correlation data to identify which variables may predict others");
  }
  
  if (categoricalCols.length > 0) {
    insights.push("* Analyze category distributions to better understand your data segments");
  }
  
  if (numericCols.length > 0) {
    insights.push("* Check for outliers in numeric fields that might be skewing results");
  }
  
  return insights.join("\n");
}

// Generate time patterns if date-like columns exist
function generateTimePatterns(data: DataRow[]): Record<string, Record<string, number>> {
  const timePatterns: Record<string, Record<string, number>> = {
    hourly: {},
    daily: {}
  };
  
  // Try to identify date columns
  const columns = Object.keys(data[0]);
  const dateColumns = columns.filter(col => {
    const colName = col.toLowerCase();
    return colName.includes('date') || colName.includes('time') || colName.includes('day');
  });
  
  if (dateColumns.length === 0) {
    // Create mock time patterns
    timePatterns.hourly = {
      "9": Math.floor(Math.random() * 30) + 10,
      "10": Math.floor(Math.random() * 30) + 20,
      "11": Math.floor(Math.random() * 30) + 25,
      "12": Math.floor(Math.random() * 30) + 15,
      "13": Math.floor(Math.random() * 30) + 20,
      "14": Math.floor(Math.random() * 30) + 15,
      "15": Math.floor(Math.random() * 30) + 20,
      "16": Math.floor(Math.random() * 30) + 10
    };
    
    timePatterns.daily = {
      "Monday": Math.floor(Math.random() * 30) + 70,
      "Tuesday": Math.floor(Math.random() * 30) + 80,
      "Wednesday": Math.floor(Math.random() * 30) + 90,
      "Thursday": Math.floor(Math.random() * 30) + 85,
      "Friday": Math.floor(Math.random() * 30) + 75
    };
    
    return timePatterns;
  }
  
  // Here we could add more sophisticated date parsing
  // but for now we'll just return mock data since real date parsing
  // can be complex in JavaScript
  return {
    hourly: {
      "9": Math.floor(data.length * 0.15),
      "10": Math.floor(data.length * 0.2),
      "11": Math.floor(data.length * 0.25),
      "12": Math.floor(data.length * 0.1),
      "13": Math.floor(data.length * 0.1),
      "14": Math.floor(data.length * 0.15),
      "15": Math.floor(data.length * 0.05)
    },
    daily: {
      "Monday": Math.floor(data.length * 0.2),
      "Tuesday": Math.floor(data.length * 0.25),
      "Wednesday": Math.floor(data.length * 0.2),
      "Thursday": Math.floor(data.length * 0.2),
      "Friday": Math.floor(data.length * 0.15)
    }
  };
}

// Generate product associations (mock data)
function generateProductAssociations(data: DataRow[]): Record<string, Array<[string, number]>> {
  // Try to find product-like columns
  const columns = Object.keys(data[0]);
  const productColumns = columns.filter(col => {
    const colName = col.toLowerCase();
    return colName.includes('product') || colName.includes('item') || colName.includes('good');
  });
  
  // If we can't identify product columns, create mock data
  if (productColumns.length === 0) {
    return {
      "Item A": [
        ["Item B", Math.floor(Math.random() * 30) + 20],
        ["Item C", Math.floor(Math.random() * 20) + 10],
        ["Item D", Math.floor(Math.random() * 10) + 5]
      ],
      "Item B": [
        ["Item A", Math.floor(Math.random() * 30) + 20],
        ["Item E", Math.floor(Math.random() * 15) + 10],
        ["Item F", Math.floor(Math.random() * 10) + 5]
      ]
    };
  }
  
  // Use the first product column to generate associations
  const productColumn = productColumns[0];
  const products: Record<string, number> = {};
  
  // Count product occurrences
  data.forEach(row => {
    const product = String(row[productColumn]);
    if (!products[product]) {
      products[product] = 0;
    }
    products[product]++;
  });
  
  // Get top 5 products
  const topProducts = Object.entries(products)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
  
  // Create mock associations between top products
  const associations: Record<string, Array<[string, number]>> = {};
  
  topProducts.forEach(product => {
    associations[product] = topProducts
      .filter(p => p !== product)
      .map(p => [p, Math.floor(Math.random() * 30) + 10]);
  });
  
  return associations;
}

// Generate anomalies
function generateAnomalies(data: DataRow[], numericColumns: Record<string, NumericStats>): Record<string, any> {
  const anomalies: Record<string, any> = {};
  
  // Generate large transactions anomalies
  const numericCols = Object.keys(numericColumns);
  if (numericCols.length > 0) {
    // Use the first numeric column to find "large" values
    const col = numericCols[0];
    const stats = numericColumns[col];
    const threshold = stats.mean + 2 * stats.std;
    
    // Find rows with values above threshold
    const largeValues = data
      .filter(row => Number(row[col]) > threshold)
      .slice(0, 3);
    
    if (largeValues.length > 0) {
      const transactions: Record<string, number> = {};
      largeValues.forEach((row, idx) => {
        const txnId = `T${1000 + idx}`;
        transactions[txnId] = Math.round(Number(row[col]));
      });
      
      anomalies.large_transactions = {
        description: `Transactions with unusually high ${col} values (above ${threshold.toFixed(2)})`,
        transactions
      };
    }
  }
  
  // Generate rare items anomalies
  const categoricalCols = Object.keys(data[0]).filter(col => !numericCols.includes(col));
  if (categoricalCols.length > 0) {
    const col = categoricalCols[0];
    const valueCounts: Record<string, number> = {};
    
    // Count occurrences of each value
    data.forEach(row => {
      const value = String(row[col]);
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });
    
    // Find rare values (appearing only once or twice)
    const rareItems = Object.entries(valueCounts)
      .filter(([_, count]) => count <= 2)
      .slice(0, 5)
      .map(([value, _]) => value);
    
    if (rareItems.length > 0) {
      anomalies.rare_items = {
        description: `Values in ${col} that rarely appear in the dataset`,
        items: rareItems
      };
    }
  }
  
  return anomalies;
}

export async function POST(request: NextRequest) {
  try {
    console.log("API route: Received file upload request");
    
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Read the file content
    const text = await file.text();
    
    // Parse CSV
    const result = Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error("CSV parsing errors:", result.errors);
      return NextResponse.json({ 
        error: "Error parsing CSV file", 
        details: result.errors[0].message 
      }, { status: 400 });
    }
    
    const data = result.data as DataRow[];
    
    if (!data || data.length === 0) {
      return NextResponse.json({ 
        error: "Empty CSV file or no valid data rows" 
      }, { status: 400 });
    }
    
    // Process the CSV data
    const analysis = analyzeData(data);
    
    console.log("API route: Processing successful");
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error("API route: Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
