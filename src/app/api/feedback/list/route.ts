import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sentiment = searchParams.get('sentiment');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (appId) where.appId = appId;
    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (sentiment) where.sentiment = sentiment;

    // Get feedback with pagination
    const [feedback, total] = await Promise.all([
      db.feedback.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit,
        include: {
          analytics: true
        }
      }),
      db.feedback.count({ where })
    ]);

    // Parse JSON fields
    const processedFeedback = feedback.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : {},
      keywords: item.keywords ? JSON.parse(item.keywords) : []
    }));

    return NextResponse.json({
      success: true,
      data: {
        feedback: processedFeedback,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Feedback list error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}