import { NextRequest, NextResponse } from "next/server"

// The URL of your serverless function
const API_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/analyze` 
  : 'http://localhost:3000/api/analyze';

export async function POST(request: NextRequest) {
  try {
    console.log("API route: Received file upload request")
    
    // Forward the request to the serverless function
    const formData = await request.formData();
    
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });
    
    // Get the response data
    const data = await response.json();
    
    // Check if there was an error
    if (!response.ok) {
      console.error("API route: Serverless function returned an error:", data.error);
      return NextResponse.json(
        { error: data.error || "Processing failed" },
        { status: response.status }
      );
    }
    
    console.log("API route: Processing successful");
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("API route: Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
