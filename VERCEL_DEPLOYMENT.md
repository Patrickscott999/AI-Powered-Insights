# Deploying AI-Powered Business Insights to Vercel

This guide provides step-by-step instructions for deploying your AI-Powered Business Insights application to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. The [Vercel CLI](https://vercel.com/docs/cli) (optional, but helpful)
3. An OpenAI API key

## Deployment Steps

### 1. Set Up Environment Variables in Vercel

Before deployment, you'll need to add your OpenAI API key as a secret environment variable in Vercel:

1. Go to the [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project (or select your existing project if you've deployed before)
3. Go to "Settings" > "Environment Variables"
4. Add a new environment variable:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key
   - Select "Production" and "Preview" environments

### 2. Deploy via GitHub

The easiest way to deploy your application is directly from your GitHub repository:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" > "Project"
3. Select your GitHub repository "AI-Powered-Insights"
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Click "Deploy"

### 3. Deploy via Vercel CLI (Alternative)

Alternatively, you can deploy using the Vercel CLI:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Log in to Vercel
vercel login

# Deploy your project
vercel
```

Follow the interactive prompts to complete the deployment.

### 4. After Deployment

1. Your app will be available at a Vercel-generated URL (e.g., `https://ai-powered-insights.vercel.app`)
2. Verify that the application works correctly
3. If needed, you can set up a custom domain in the Vercel dashboard

## Important Notes

- This deployment uses the Next.js API routes for backend functionality
- The OpenAI API key must be properly set up as an environment variable
- The application will handle fallback functionality if the OpenAI API is unavailable

## Troubleshooting

If you encounter issues during deployment:

1. Check the Vercel build logs for errors
2. Ensure your environment variables are correctly set
3. Verify that the OpenAI API key is valid

For more help, consult the [Vercel documentation](https://vercel.com/docs) or open an issue on the GitHub repository.
