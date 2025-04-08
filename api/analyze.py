from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile
import base64

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        # Set CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        # For testing in production, create a simplified mock response
        mock_data = [
            {"product": "Product A", "sales": 120, "date": "2023-01-01"},
            {"product": "Product B", "sales": 150, "date": "2023-01-01"},
            {"product": "Product A", "sales": 135, "date": "2023-01-02"},
            {"product": "Product B", "sales": 145, "date": "2023-01-02"},
        ]
        
        mock_insights = """
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
        """
        
        mock_statistics = {
            "numeric_columns": {
                "sales": {
                    "mean": 137.5,
                    "min": 120,
                    "max": 150,
                    "std": 11.8
                }
            },
            "categorical_columns": {
                "product": {
                    "unique_values": 2,
                    "most_common": "Product B"
                }
            }
        }
        
        response = {
            "data": mock_data,
            "insights": mock_insights,
            "statistics": mock_statistics,
            "total_rows": len(mock_data)
        }

        self.wfile.write(json.dumps(response).encode()) 