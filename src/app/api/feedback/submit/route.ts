import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      appId,
      userId,
      type,
      category,
      rating,
      title,
      description,
      metadata = {}
    } = body;

    // Validate required fields
    if (!appId || !type || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: appId, type, title, description' },
        { status: 400 }
      );
    }

    // Create feedback entry
    const feedback = await db.feedback.create({
      data: {
        appId,
        userId: userId || 'anonymous',
        type,
        category: category || 'general',
        rating: rating || null,
        title,
        description,
        metadata: JSON.stringify(metadata),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Trigger feedback processing (async)
    processFeedbackAsync(feedback.id);

    return NextResponse.json({
      success: true,
      data: {
        id: feedback.id,
        appId: feedback.appId,
        type: feedback.type,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    });
  } catch (error) {
    console.error('Feedback submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processFeedbackAsync(feedbackId: string) {
  try {
    // Simulate async processing - in a real implementation, this would use a message queue
    setTimeout(async () => {
      try {
        await db.feedback.update({
          where: { id: feedbackId },
          data: {
            status: 'processed',
            processedAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Analyze feedback sentiment and categorize
        await analyzeFeedback(feedbackId);
      } catch (error) {
        console.error('Feedback processing error:', error);
        await db.feedback.update({
          where: { id: feedbackId },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date()
          }
        });
      }
    }, 1000);
  } catch (error) {
    console.error('Async feedback processing error:', error);
  }
}

async function analyzeFeedback(feedbackId: string) {
  try {
    const feedback = await db.feedback.findUnique({
      where: { id: feedbackId }
    });

    if (!feedback) return;

    // Simple sentiment analysis (in production, use AI service)
    const sentiment = analyzeSentiment(feedback.description);
    
    // Extract keywords
    const keywords = extractKeywords(feedback.description);

    // Update feedback with analysis results
    await db.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment,
        keywords: JSON.stringify(keywords),
        updatedAt: new Date()
      }
    });

    // Create analytics entry
    await db.feedbackAnalytics.create({
      data: {
        feedbackId,
        appId: feedback.appId,
        type: feedback.type,
        category: feedback.category,
        rating: feedback.rating,
        sentiment,
        keywords: JSON.stringify(keywords),
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Feedback analysis error:', error);
  }
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'broken', 'bug', 'issue', 'problem'];
  
  const words = text.toLowerCase().split(/\s+/);
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction (in production, use NLP service)
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'a', 'an'];
  
  const words = text.toLowerCase().split(/\s+/)
    .map(word => word.replace(/[^\w\s]/g, ''))
    .filter(word => word.length > 3 && !commonWords.includes(word));
  
  // Count word frequency
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Return top 5 keywords
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
}