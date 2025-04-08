# AI-Powered Insights App

An advanced data analysis application that processes CSV files to provide AI-generated insights, visualizations, and analytics.

## Features

- **Time Series Analysis**: Analyze transaction patterns by hour, day, and week
- **Correlation Matrix View**: Visualize relationships between categorical variables
- **Product Association Analysis**: Discover "frequently bought together" patterns
- **Customer Segmentation**: RFM analysis for customer classification
- **Predictive Modeling**: Sales forecasting with confidence intervals
- **Anomaly Detection**: Identify unusual patterns in transactions

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Python, Flask
- **Data Processing**: Pandas, NumPy, scikit-learn
- **Visualizations**: Recharts, D3.js
- **AI Integration**: OpenAI API

## Local Development

### Setup Python Backend

1. Create a Python virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the Flask app:
   ```
   python app.py
   ```

### Setup Next.js Frontend

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

## Deployment Guide

### Deploy Python Backend to Heroku

1. Create a Heroku account and install the Heroku CLI
2. Log in to Heroku:
   ```
   heroku login
   ```

3. Create a new Heroku app:
   ```
   heroku create your-app-name
   ```

4. Push to Heroku:
   ```
   git push heroku main
   ```

5. Set up environment variables:
   ```
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   ```

### Deploy Next.js Frontend to Vercel

1. Create a Vercel account and install the Vercel CLI
2. Log in to Vercel:
   ```
   vercel login
   ```

3. Deploy to Vercel:
   ```
   vercel
   ```

4. Set up environment variables in the Vercel dashboard:
   - BACKEND_URL=https://your-heroku-app-name.herokuapp.com

## Usage

1. Visit the application in your web browser
2. Upload a CSV file containing transaction data
3. The application will automatically analyze the data and display insights
4. Navigate between different visualization tabs to explore various aspects of your data

## License

MIT 