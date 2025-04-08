import sys
import pandas as pd
import numpy as np
import json
from openai import OpenAI
from dotenv import load_dotenv
import os
import traceback
import datetime
import warnings

# Suppress warnings
warnings.filterwarnings('ignore')

load_dotenv()

# Print debug messages to stderr
def debug_print(message):
    print(message, file=sys.stderr)

# Custom JSON encoder to handle datetime objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if pd.isnull(obj):
            return None
        if isinstance(obj, (pd.Timestamp, datetime.datetime, datetime.date)):
            return obj.isoformat()
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

def generate_basic_insights(stats):
    """Generate basic insights without using OpenAI API"""
    insights = []
    
    # Analyze numeric columns
    for col, values in stats['numeric_columns'].items():
        insights.append(f"Column '{col}' statistics:")
        insights.append(f"- Average: {values['mean']:.2f}")
        insights.append(f"- Range: {values['min']:.2f} to {values['max']:.2f}")
        insights.append(f"- Standard deviation: {values['std']:.2f}")
        insights.append("")
    
    # Analyze categorical columns
    for col, values in stats['categorical_columns'].items():
        insights.append(f"Column '{col}' analysis:")
        insights.append(f"- Number of unique values: {values['unique_values']}")
        insights.append(f"- Most common value: {values['most_common']}")
        insights.append("")
    
    # Analyze correlations
    if stats['correlations']:
        insights.append("Correlation Analysis:")
        for col1, correlations in stats['correlations'].items():
            for col2, value in correlations.items():
                if col1 < col2:  # Avoid duplicate correlations
                    insights.append(f"- {col1} vs {col2}: {value:.2f}")
    
    # Add time series insights if available
    if 'time_patterns' in stats:
        insights.append("\nTime Pattern Analysis:")
        
        if 'hourly' in stats['time_patterns']:
            peak_hour = max(stats['time_patterns']['hourly'].items(), key=lambda x: x[1])[0]
            insights.append(f"- Peak hour with most transactions: {peak_hour}:00")
        
        if 'daily' in stats['time_patterns']:
            peak_day = max(stats['time_patterns']['daily'].items(), key=lambda x: x[1])[0]
            insights.append(f"- Peak day with most transactions: {peak_day}")
        
        if 'weekday_weekend' in stats['time_patterns']:
            wk = stats['time_patterns']['weekday_weekend']
            insights.append(f"- Distribution: {wk.get('weekday', 0)} weekday transactions vs {wk.get('weekend', 0)} weekend transactions")
    
    # Add product association insights if available
    if 'product_associations' in stats and stats['product_associations']:
        insights.append("\nProduct Association Analysis:")
        for item, associated_items in list(stats['product_associations'].items())[:5]:  # Top 5 for brevity
            items_str = ", ".join([f"{item_name} ({count})" for item_name, count in associated_items[:3]])
            insights.append(f"- Items frequently purchased with {item}: {items_str}")
    
    # Add forecasting insights if available
    if 'forecast' in stats and stats['forecast']:
        insights.append("\nSales Forecast Analysis:")
        forecast = stats['forecast']
        if 'trend' in forecast:
            trend_direction = "upward" if forecast['trend'] > 0 else "downward"
            insights.append(f"- Sales trend: {trend_direction} trend detected with {abs(forecast['trend']):.1f}% monthly change")
        
        if 'seasonal_periods' in forecast:
            insights.append(f"- Seasonal patterns: {forecast['seasonal_periods']}")
        
        if 'peak_forecast_day' in forecast:
            insights.append(f"- Peak sales forecast: {forecast['peak_forecast_day']}")
    
    # Add customer segmentation insights if available
    if 'customer_segments' in stats and stats['customer_segments']:
        insights.append("\nCustomer Segmentation Analysis:")
        segments = stats['customer_segments'].get('segments', {})
        for segment, count in segments.items():
            insights.append(f"- {segment}: {count} customers ({count/sum(segments.values())*100:.1f}%)")
    
    return "\n".join(insights)

def analyze_time_patterns(df):
    """Extract time-based patterns from date_time column"""
    time_patterns = {}
    
    # Ensure date_time is properly formatted
    try:
        # Check if date_time column exists
        if 'date_time' not in df.columns:
            debug_print("No date_time column found for time series analysis")
            return time_patterns
            
        # Convert date_time to datetime format
        df_copy = df.copy()
        df_copy['datetime'] = pd.to_datetime(df_copy['date_time'], format='%d-%m-%Y %H:%M', errors='coerce')
        
        if df_copy['datetime'].isna().all():
            debug_print("Failed to parse date_time column")
            return time_patterns
            
        # Extract hour, day, month
        df_copy['hour'] = df_copy['datetime'].dt.hour
        df_copy['day'] = df_copy['datetime'].dt.day_name()
        df_copy['month'] = df_copy['datetime'].dt.month_name()
        
        # Hourly patterns (count of transactions by hour)
        hourly_counts = df_copy.groupby('hour')['Transaction'].nunique().to_dict()
        time_patterns['hourly'] = hourly_counts
        
        # Daily patterns (count of transactions by day of week)
        daily_counts = df_copy.groupby('day')['Transaction'].nunique().to_dict()
        time_patterns['daily'] = daily_counts
        
        # Monthly patterns (count of transactions by month)
        monthly_counts = df_copy.groupby('month')['Transaction'].nunique().to_dict()
        time_patterns['monthly'] = monthly_counts
        
        # Weekday vs Weekend (if period_day exists)
        if 'weekday_weekend' in df_copy.columns:
            weekday_weekend = df_copy.groupby('weekday_weekend')['Transaction'].nunique().to_dict()
            time_patterns['weekday_weekend'] = weekday_weekend
            
        # Time of day patterns (if period_day exists)
        if 'period_day' in df_copy.columns:
            period_counts = df_copy.groupby('period_day')['Transaction'].nunique().to_dict()
            time_patterns['period_day'] = period_counts
        
        debug_print(f"Time patterns extracted: {len(time_patterns)} categories")
        
    except Exception as e:
        debug_print(f"Error analyzing time patterns: {str(e)}")
        debug_print(traceback.format_exc())
    
    return time_patterns

def forecast_sales(df, forecast_periods=30):
    """Forecast future sales using time series modeling"""
    forecast_result = {}
    
    try:
        # Check for required columns
        if 'date_time' not in df.columns or 'Transaction' not in df.columns:
            debug_print("Required columns not found for forecasting")
            return forecast_result
            
        # Convert date_time to datetime and prepare data
        df_copy = df.copy()
        df_copy['datetime'] = pd.to_datetime(df_copy['date_time'], format='%d-%m-%Y %H:%M', errors='coerce')
        
        if df_copy['datetime'].isna().all():
            debug_print("Failed to parse date_time column for forecasting")
            return forecast_result
            
        # Create daily transaction counts
        daily_sales = df_copy.groupby(df_copy['datetime'].dt.date)['Transaction'].nunique()
        
        # Try using Prophet if available
        try:
            from prophet import Prophet
            
            # Prepare data for Prophet
            prophet_df = pd.DataFrame({
                'ds': daily_sales.index,
                'y': daily_sales.values
            })
            
            # Create and train model
            model = Prophet(
                daily_seasonality=False,
                weekly_seasonality=True,
                yearly_seasonality=True,
                seasonality_mode='multiplicative'
            )
            model.fit(prophet_df)
            
            # Create future dataframe and predict
            future = model.make_future_dataframe(periods=forecast_periods)
            fcst = model.predict(future)
            
            # Return forecast, components, and confidence intervals
            last_date = prophet_df['ds'].iloc[-1]
            future_forecast = fcst[fcst['ds'] > last_date].copy()
            
            # Calculate trend
            first_pred = future_forecast['yhat'].iloc[0]
            last_pred = future_forecast['yhat'].iloc[-1]
            trend_pct = ((last_pred - first_pred) / first_pred) * 100 if first_pred > 0 else 0
            
            # Get seasonal periods
            seasonality = []
            if 'weekly' in model.seasonalities:
                seasonality.append('weekly')
            if 'yearly' in model.seasonalities:
                seasonality.append('yearly')
            if 'daily' in model.seasonalities:
                seasonality.append('daily')
                
            # Get peak forecast day
            peak_day_idx = future_forecast['yhat'].idxmax()
            peak_day = future_forecast['ds'].iloc[peak_day_idx]
            
            forecast_result = {
                'dates': future_forecast['ds'].dt.strftime('%Y-%m-%d').tolist(),
                'predicted': future_forecast['yhat'].round().astype(int).tolist(),
                'lower_bound': future_forecast['yhat_lower'].round().astype(int).tolist(),
                'upper_bound': future_forecast['yhat_upper'].round().astype(int).tolist(),
                'trend': trend_pct,
                'seasonal_periods': ', '.join(seasonality),
                'peak_forecast_day': peak_day.strftime('%Y-%m-%d')
            }
            
            debug_print("Sales forecast generated successfully using Prophet")
        
        except Exception as e:
            debug_print(f"Error using Prophet for forecasting: {str(e)}")
            debug_print("Falling back to simple forecasting method")
            
            # Simple forecasting method - Moving Average
            try:
                import statsmodels.api as sm
                
                # Convert to time series and resample
                ts = pd.Series(daily_sales.values, index=daily_sales.index)
                
                # Apply simple exponential smoothing
                model = sm.tsa.ExponentialSmoothing(ts, 
                                                   seasonal_periods=7,
                                                   trend='add',
                                                   seasonal='add').fit()
                
                # Make forecast
                last_date = ts.index[-1]
                forecast_index = pd.date_range(start=last_date + pd.Timedelta(days=1), 
                                             periods=forecast_periods)
                predictions = model.forecast(forecast_periods)
                
                # Calculate trend
                first_pred = predictions[0]
                last_pred = predictions[-1]
                trend_pct = ((last_pred - first_pred) / first_pred) * 100 if first_pred > 0 else 0
                
                # Get peak forecast day
                peak_day_idx = predictions.argmax()
                peak_day = forecast_index[peak_day_idx]
                
                forecast_result = {
                    'dates': [d.strftime('%Y-%m-%d') for d in forecast_index],
                    'predicted': predictions.round().astype(int).tolist(),
                    'lower_bound': (predictions * 0.8).round().astype(int).tolist(),
                    'upper_bound': (predictions * 1.2).round().astype(int).tolist(),
                    'trend': trend_pct,
                    'seasonal_periods': 'weekly',
                    'peak_forecast_day': peak_day.strftime('%Y-%m-%d')
                }
                debug_print("Sales forecast generated successfully using statsmodels")
                
            except Exception as e:
                debug_print(f"Error using statsmodels for forecasting: {str(e)}")
                debug_print("Using very simple moving average for forecasting")
                
                # Very simple moving average
                window_size = min(7, len(daily_sales))
                ma = daily_sales.rolling(window=window_size).mean().iloc[-1]
                
                forecast_dates = [
                    (daily_sales.index[-1] + datetime.timedelta(days=i+1)).strftime('%Y-%m-%d') 
                    for i in range(forecast_periods)
                ]
                
                forecast_result = {
                    'dates': forecast_dates,
                    'predicted': [int(ma)] * forecast_periods,
                    'lower_bound': [int(ma * 0.8)] * forecast_periods,
                    'upper_bound': [int(ma * 1.2)] * forecast_periods,
                    'trend': 0,
                    'seasonal_periods': 'not detected',
                    'peak_forecast_day': forecast_dates[0]
                }
                debug_print("Sales forecast generated using simple moving average")
    
    except Exception as e:
        debug_print(f"Error generating sales forecast: {str(e)}")
        debug_print(traceback.format_exc())
    
    return forecast_result

def segment_customers(df):
    """Group customers by purchase behavior (RFM analysis)"""
    customer_segments = {}
    
    try:
        # Check if required columns exist
        if 'Transaction' not in df.columns or 'Item' not in df.columns:
            debug_print("Required columns for customer segmentation not found")
            return customer_segments
            
        # Create a copy for processing
        df_copy = df.copy()
        
        # Convert date_time to datetime if available
        if 'date_time' in df_copy.columns:
            df_copy['datetime'] = pd.to_datetime(df_copy['date_time'], format='%d-%m-%Y %H:%M', errors='coerce')
            today = df_copy['datetime'].max()
        else:
            debug_print("No date column found, using transaction count only for segmentation")
            today = pd.Timestamp.now()
        
        # Group by transaction (as a proxy for customer ID)
        if 'datetime' in df_copy.columns:
            rfm = df_copy.groupby('Transaction').agg({
                'datetime': lambda x: (today - x.max()).days,  # Recency
                'Item': 'count',                              # Frequency
            }).rename(columns={
                'datetime': 'recency',
                'Item': 'frequency'
            })
        else:
            rfm = df_copy.groupby('Transaction').agg({
                'Item': 'count',                              # Frequency
            }).rename(columns={
                'Item': 'frequency'
            })
            # Add dummy recency
            rfm['recency'] = 1
        
        # Create RFM segments
        rfm['R_score'] = pd.qcut(rfm['recency'], q=5, labels=[5, 4, 3, 2, 1])
        rfm['F_score'] = pd.qcut(rfm['frequency'], q=5, labels=[1, 2, 3, 4, 5])
        
        # Calculate RFM Score and segment
        rfm['RFM_score'] = rfm['R_score'].astype(str) + rfm['F_score'].astype(str)
        
        # Define segments
        segments = {
            'Champions': ['55', '54', '45'],
            'Loyal': ['53', '52', '51', '44', '43', '42', '35', '34', '33'],
            'Potential': ['41', '32', '31', '25', '24', '23'],
            'New': ['15', '14', '13', '12', '11'],
            'At Risk': ['50', '40', '30', '20', '10'],
            'Others': []
        }
        
        # Map segments
        rfm['segment'] = rfm['RFM_score'].apply(lambda x: next((k for k, v in segments.items() if x in v), 'Others'))
        
        # Create segment summary
        segment_counts = rfm['segment'].value_counts().to_dict()
        
        # Calculate segment averages
        segment_stats = rfm.groupby('segment').agg({
            'recency': 'mean',
            'frequency': 'mean',
        }).to_dict()
        
        # Prepare result
        customer_segments = {
            'segments': segment_counts,
            'segment_stats': segment_stats,
            'top_customers': rfm.sort_values('frequency', ascending=False).head(10).to_dict()
        }
        
        debug_print(f"Customer segmentation completed: {len(segment_counts)} segments identified")
        
    except Exception as e:
        debug_print(f"Error in customer segmentation: {str(e)}")
        debug_print(traceback.format_exc())
    
    return customer_segments

def analyze_product_associations(df, min_support=10):
    """Find items frequently bought together"""
    try:
        if 'Item' not in df.columns or 'Transaction' not in df.columns:
            debug_print("Required columns not found for product association analysis")
            return {}
            
        # Group items by transaction
        transactions = df.groupby('Transaction')['Item'].apply(list).reset_index()
        
        # Calculate item frequencies
        item_counts = df['Item'].value_counts().to_dict()
        
        # Find items that occur together
        associations = {}
        
        # Get list of items with count > min_support
        popular_items = [item for item, count in item_counts.items() if count >= min_support]
        
        for item in popular_items[:30]:  # Limit to top 30 popular items for performance
            # Find all transactions containing this item
            item_transactions = transactions[transactions['Item'].apply(lambda x: item in x)]['Transaction'].tolist()
            
            # Get all other items in these transactions
            related_items = {}
            for trans_id in item_transactions:
                items = df[df['Transaction'] == trans_id]['Item'].tolist()
                for related_item in items:
                    if related_item != item:
                        related_items[related_item] = related_items.get(related_item, 0) + 1
            
            # Sort by frequency and keep top items
            sorted_items = sorted(related_items.items(), key=lambda x: x[1], reverse=True)
            if sorted_items:
                associations[item] = sorted_items[:5]  # Keep top 5 associated items
        
        debug_print(f"Product associations found for {len(associations)} items")
        return associations
        
    except Exception as e:
        debug_print(f"Error analyzing product associations: {str(e)}")
        debug_print(traceback.format_exc())
        return {}

def generate_correlation_matrix(df):
    """Generate correlation matrix for categorical variables"""
    try:
        if df.empty or len(df.columns) < 2:
            return {}
            
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        if len(categorical_cols) < 2:
            return {}
            
        # Select a subset of categorical columns to analyze
        selected_cols = categorical_cols[:4]  # Limit to first 4 to avoid too large matrix
        
        # Initialize matrix
        matrix = {}
        
        # Calculate Cramer's V for each pair of categorical columns
        for i, col1 in enumerate(selected_cols):
            matrix[col1] = {}
            for col2 in selected_cols:
                if col1 == col2:
                    matrix[col1][col2] = 1.0  # Perfect correlation with self
                elif col2 in matrix and col1 in matrix[col2]:
                    matrix[col1][col2] = matrix[col2][col1]  # Symmetric
                else:
                    # Calculate contingency table
                    contingency = pd.crosstab(df[col1], df[col2])
                    # Calculate Cramer's V using scipy.stats
                    try:
                        from scipy.stats import chi2_contingency
                        chi2 = chi2_contingency(contingency)[0]
                        n = contingency.sum().sum()
                        phi2 = chi2 / n
                        r, k = contingency.shape
                        phi2corr = max(0, phi2 - ((k-1)*(r-1))/(n-1))
                        rcorr = r - ((r-1)**2)/(n-1)
                        kcorr = k - ((k-1)**2)/(n-1)
                        cramer_v = np.sqrt(phi2corr / min((kcorr-1), (rcorr-1)))
                        matrix[col1][col2] = round(cramer_v, 3)
                    except Exception as e:
                        debug_print(f"Error calculating Cramer's V for {col1} and {col2}: {str(e)}")
                        matrix[col1][col2] = 0.0
        
        debug_print(f"Generated correlation matrix for {len(selected_cols)} categorical columns")
        return matrix
        
    except Exception as e:
        debug_print(f"Error generating correlation matrix: {str(e)}")
        debug_print(traceback.format_exc())
        return {}

def detect_anomalies(df):
    """Detect anomalies in the dataset"""
    anomalies = {}
    
    try:
        # Check for unusual transaction patterns
        if 'Transaction' in df.columns and 'Item' in df.columns:
            # Transactions with unusually high number of items
            transaction_sizes = df.groupby('Transaction').size()
            mean_size = transaction_sizes.mean()
            std_size = transaction_sizes.std()
            large_threshold = mean_size + 2 * std_size
            
            large_transactions = transaction_sizes[transaction_sizes > large_threshold]
            if not large_transactions.empty:
                anomalies['large_transactions'] = {
                    'description': f"Transactions with unusually high number of items (>{large_threshold:.1f})",
                    'transactions': large_transactions.to_dict()
                }
            
            # Unusual item frequency
            item_frequency = df['Item'].value_counts()
            rare_items = item_frequency[item_frequency == 1].index.tolist()
            if rare_items:
                anomalies['rare_items'] = {
                    'description': "Items that appear only once in the dataset",
                    'items': rare_items[:10]  # Limit to first 10
                }
            
            # Time anomalies if datetime exists in the dataframe
            df_copy = df.copy()
            if 'date_time' in df_copy.columns:
                # Convert date_time to datetime if it's not already processed
                if 'datetime' not in df_copy.columns:
                    df_copy['datetime'] = pd.to_datetime(df_copy['date_time'], format='%d-%m-%Y %H:%M', errors='coerce')
                    df_copy['hour'] = df_copy['datetime'].dt.hour
                
                # Unusual hours - transactions outside business hours
                hour_counts = df_copy['hour'].value_counts()
                late_hours = [h for h in range(22, 24)] + [h for h in range(0, 6)]
                unusual_hours = {str(hour): int(count) for hour, count in hour_counts.items() if hour in late_hours}
                if unusual_hours:
                    anomalies['unusual_hours'] = {
                        'description': "Transactions during unusual hours (10PM-6AM)",
                        'counts': unusual_hours
                    }
        
        debug_print(f"Detected {len(anomalies)} types of anomalies")
        
    except Exception as e:
        debug_print(f"Error detecting anomalies: {str(e)}")
        debug_print(traceback.format_exc())
    
    return anomalies

def generate_insights(df):
    debug_print("Generating insights for dataset")
    # Calculate basic statistics
    stats = {
        'numeric_columns': {},
        'categorical_columns': {},
        'correlations': {}
    }
    
    # Process numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    debug_print(f"Found {len(numeric_cols)} numeric columns: {list(numeric_cols)}")
    for col in numeric_cols:
        stats['numeric_columns'][col] = {
            'mean': float(df[col].mean()),
            'median': float(df[col].median()),
            'std': float(df[col].std()),
            'min': float(df[col].min()),
            'max': float(df[col].max())
        }
    
    # Process categorical columns
    categorical_cols = df.select_dtypes(include=['object']).columns
    debug_print(f"Found {len(categorical_cols)} categorical columns: {list(categorical_cols)}")
    for col in categorical_cols:
        stats['categorical_columns'][col] = {
            'unique_values': int(df[col].nunique()),
            'most_common': df[col].value_counts().index[0]
        }
    
    # Calculate correlations between numeric columns
    if len(numeric_cols) > 1:
        debug_print("Calculating correlations between numeric columns")
        corr_matrix = df[numeric_cols].corr()
        stats['correlations'] = corr_matrix.to_dict()
    
    # Add time patterns analysis
    stats['time_patterns'] = analyze_time_patterns(df)
    
    # Add product associations
    stats['product_associations'] = analyze_product_associations(df)
    
    # Add categorical correlation matrix
    stats['categorical_correlation'] = generate_correlation_matrix(df)
    
    # Add anomaly detection
    stats['anomalies'] = detect_anomalies(df)
    
    # Add sales forecasting
    stats['forecast'] = forecast_sales(df)
    
    # Add customer segmentation
    stats['customer_segments'] = segment_customers(df)
    
    # Try to generate GPT insights, fall back to basic insights if OpenAI fails
    debug_print("Attempting to generate GPT insights")
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        debug_print("No OpenAI API key found in environment variables")
        return {
            'statistics': stats,
            'insights': generate_basic_insights(stats)
        }

    try:
        client = OpenAI()
        
        prompt = f"""Analyze this dataset and provide key insights. Here are the statistics:
        {json.dumps(stats, indent=2, cls=CustomJSONEncoder)}
        
        Please provide:
        1. Key trends and patterns
        2. Notable correlations
        3. Potential business implications
        4. Time-based patterns and insights
        5. Product association findings
        6. Customer segmentation insights
        7. Sales forecasting interpretation
        8. Any anomalies detected
        
        Keep the response concise and focused on actionable insights."""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a data analyst providing insights on datasets."},
                {"role": "user", "content": prompt}
            ]
        )
        
        debug_print("GPT insights generated successfully")
        return {
            'statistics': stats,
            'insights': response.choices[0].message.content
        }
    except Exception as e:
        error_message = str(e)
        debug_print(f"Error generating GPT insights: {error_message}")
        
        # Check if it's a quota error
        if "insufficient_quota" in error_message or "429" in error_message:
            debug_print("OpenAI API quota exceeded. Using basic insights.")
        else:
            debug_print(f"Unexpected error: {error_message}")
            debug_print(f"Traceback: {traceback.format_exc()}")
        
        debug_print("Falling back to basic insights")
        return {
            'statistics': stats,
            'insights': generate_basic_insights(stats)
        }

def process_data(file_path):
    debug_print(f"Processing data from {file_path}")
    try:
        # Read the CSV file
        df = pd.read_csv(file_path)
        debug_print(f"CSV file loaded with {len(df)} rows and {len(df.columns)} columns")
        
        # Basic data cleaning
        df = df.dropna()  # Remove rows with missing values
        debug_print(f"After dropping NA values: {len(df)} rows")
        
        # Create a clean copy of the dataframe without added datetime columns
        # This will be used for the sample data to prevent JSON serialization issues
        df_clean = df.copy()
        
        # Generate insights and statistics
        analysis_results = generate_insights(df)
        
        # Limit the data to a maximum of 100 rows to prevent large responses
        data_sample = df_clean.head(100).to_dict('records')
        debug_print(f"Converted DataFrame to {len(data_sample)} records (limited to 100 rows)")
        
        # Get column names (only original columns)
        columns = df_clean.columns.tolist()
        debug_print(f"Columns: {columns}")
        
        # Combine all results
        results = {
            'data': data_sample,  # Limited to 100 rows
            'columns': columns,
            'insights': analysis_results['insights'],
            'statistics': analysis_results['statistics'],
            'total_rows': len(df)  # Include the total number of rows for reference
        }
        
        # Convert to JSON and print
        debug_print("Converting results to JSON")
        # Print ONLY the JSON data to stdout (this will be parsed by the API route)
        print(json.dumps(results, cls=CustomJSONEncoder))
        debug_print("Processing completed successfully")
    except Exception as e:
        debug_print(f"Error processing file: {str(e)}")
        debug_print(traceback.format_exc())
        error_result = {
            'error': f"Error processing file: {str(e)}",
            'data': [],
            'columns': [],
            'insights': '',
            'statistics': {}
        }
        # Print the error JSON to stdout
        print(json.dumps(error_result))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        process_data(file_path)
    else:
        debug_print("Please provide a file path")
