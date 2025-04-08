import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("API route: Received file upload request")
    
    // For testing in production, create a simplified mock response
    const mockData = [
      { product: "Product A", sales: 120, date: "2023-01-01" },
      { product: "Product B", sales: 150, date: "2023-01-01" },
      { product: "Product A", sales: 135, date: "2023-01-02" },
      { product: "Product B", sales: 145, date: "2023-01-02" },
    ];
    
    const mockInsights = `
    # Key Insights from Data Analysis
    
    ## Sales Trends
    - Product B consistently outperforms Product A in sales
    - There is a slight upward trend in overall sales
    
    ## Customer Behavior
    - Most purchases occur during weekdays
    - Product pairs A+B are frequently bought together
    
    ## Recommendations
    - Focus marketing efforts on weekday promotions
    - Consider bundle discounts for Products A and B
    `;
    
    const mockStatistics = {
      numeric_columns: {
        sales: {
          mean: 137.5,
          min: 120,
          max: 150,
          std: 11.8
        }
      },
      categorical_columns: {
        product: {
          unique_values: 2,
          most_common: "Product B"
        }
      },
      correlations: {
        "product": {
          "product": 1.0,
          "sales": 0.82
        },
        "sales": {
          "product": 0.82,
          "sales": 1.0
        }
      },
      time_patterns: {
        hourly: {
          "9": 25,
          "10": 30,
          "11": 45,
          "12": 20,
          "13": 15,
          "14": 35,
          "15": 40,
          "16": 30,
          "17": 20
        },
        daily: {
          "Monday": 120,
          "Tuesday": 100,
          "Wednesday": 110,
          "Thursday": 130,
          "Friday": 140
        }
      },
      product_associations: {
        "Product A": [
          ["Product B", 42],
          ["Product C", 28],
          ["Product D", 15]
        ],
        "Product B": [
          ["Product A", 42],
          ["Product C", 32],
          ["Product E", 18]
        ]
      },
      forecast: {
        trend: 5.2,
        seasonal_periods: "weekly",
        peak_forecast_day: "2023-02-15"
      },
      customer_segments: {
        segments: {
          "High Value": 120,
          "Medium Value": 350,
          "Low Value": 530
        }
      },
      anomalies: {
        large_transactions: {
          description: "Transactions with unusually high number of items",
          transactions: {
            "T1001": 25,
            "T1042": 32,
            "T1078": 28
          }
        },
        rare_items: {
          description: "Items that rarely appear in transactions",
          items: ["Product X", "Product Y", "Product Z"]
        }
      }
    };
    
    const response = {
      data: mockData,
      insights: mockInsights,
      statistics: mockStatistics,
      total_rows: mockData.length
    };
    
    console.log("API route: Processing successful");
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("API route: Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
