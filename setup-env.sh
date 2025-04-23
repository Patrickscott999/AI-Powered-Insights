#!/bin/bash

# Script to set up environment variables for AI Powered Insights

echo "Setting up environment variables for AI Powered Insights..."

# Prompt for OpenAI API key
echo -n "Enter your OpenAI API key: "
read -s OPENAI_API_KEY
echo ""

# Write to .env.local
echo "OPENAI_API_KEY=$OPENAI_API_KEY" > .env.local

echo "Environment variables have been set up in .env.local"
echo "You can now restart the application to use OpenAI for the chatbot."
