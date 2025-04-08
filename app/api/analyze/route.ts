import { NextRequest, NextResponse } from "next/server"

// The URL of your Python backend, to be set via environment variable
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export async function POST(request: NextRequest) {
  try {
    console.log("API route: Received file upload request")
    
    // Forward the request to the Python backend
    const response = await fetch(`${BACKEND_URL}/api/analyze`, {
      method: "POST",
      body: await request.formData(),
    });
    
    // Get the response data
    const data = await response.json();
    
    // Check if there was an error
    if (!response.ok) {
      console.error("API route: Backend returned an error:", data.error);
      return NextResponse.json(
        { error: data.error || "Backend processing failed" },
        { status: response.status }
      );
    }
    
    console.log("API route: Backend processing successful");
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("API route: Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
