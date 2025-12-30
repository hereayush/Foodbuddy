import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the secret environment variable is set to "true"
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Return a 503 Service Unavailable response with a simple message
    return new NextResponse(
      `
      <div style="display:flex; height:100vh; align-items:center; justify-content:center; font-family:sans-serif;">
        <div style="text-align:center;">
          <h1>🚧 Under Maintenance</h1>
          <p>We are currently updating FoodBuddy. Please check back later.</p>
        </div>
      </div>
      `,
      { status: 503, headers: { 'content-type': 'text/html' } }
    )
  }
}

// Apply this to all routes
export const config = {
  matcher: '/:path*',
}