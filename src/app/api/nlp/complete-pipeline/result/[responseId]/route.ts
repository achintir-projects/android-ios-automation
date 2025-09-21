import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisResult } from '@/lib/analysis-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  try {
    const { responseId } = await params;
    
    // Retrieve the stored result
    const storedResult = getAnalysisResult(responseId);
    
    if (!storedResult) {
      return NextResponse.json({
        success: false,
        error: 'Result not found',
        responseId,
        status: 'not_found'
      }, { status: 404 });
    }
    
    // Check if the result is still being processed
    if (storedResult.status === 'processing') {
      return NextResponse.json({
        success: false,
        error: 'Still processing',
        responseId,
        status: 'processing',
        estimatedProcessingTime: storedResult.estimatedProcessingTime || '30-45 seconds',
        startedAt: storedResult.startedAt,
        currentProgress: 'Processing pipeline steps...'
      }, { status: 202 });
    }
    
    // Check if the result has an error
    if (storedResult.status === 'error') {
      return NextResponse.json({
        success: false,
        error: storedResult.error || 'Processing failed',
        responseId,
        status: 'error',
        completedAt: storedResult.completedAt
      }, { status: 500 });
    }
    
    // Return the completed result
    return NextResponse.json({
      success: true,
      data: storedResult.data || storedResult,
      responseId,
      status: storedResult.status,
      processedAt: storedResult.processedAt || storedResult.completedAt,
      completedAt: storedResult.completedAt
    });
    
  } catch (error) {
    console.error('Error retrieving pipeline result:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve result',
      responseId: (await params).responseId,
      status: 'error'
    }, { status: 500 });
  }
}