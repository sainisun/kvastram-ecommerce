import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    success: true,
    service: 'storefront',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}
