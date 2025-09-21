import { NextRequest, NextResponse } from 'next/server';
import { listStoredResults } from '@/lib/analysis-storage';

export async function GET(request: NextRequest) {
  try {
    const count = listStoredResults();
    
    return NextResponse.json({
      success: true,
      message: 'Pipeline debug endpoint',
      storedResultsCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}