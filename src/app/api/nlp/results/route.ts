import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisResult, listStoredResults } from '@/lib/analysis-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get('responseId');

    console.log(`Results API called with responseId: ${responseId}`);
    
    // Debug: List all stored results
    const storedCount = listStoredResults();
    console.log(`Total stored results: ${storedCount}`);

    if (!responseId) {
      return NextResponse.json(
        { error: 'Missing parameter', message: 'responseId is required' },
        { status: 400 }
      );
    }

    // Check if we have the result
    const result = getAnalysisResult(responseId);
    
    if (!result) {
      console.log(`Result not found for responseId: ${responseId}`);
      return NextResponse.json(
        { 
          error: 'Not found', 
          message: 'Analysis result not found or still processing',
          responseId,
          status: 'not_found'
        },
        { status: 404 }
      );
    }

    console.log(`Result found for responseId: ${responseId}`);
    // Return the result
    return NextResponse.json({
      success: true,
      data: result,
      responseId
    });

  } catch (error) {
    console.error('Error retrieving analysis result:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'Failed to retrieve analysis result',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}