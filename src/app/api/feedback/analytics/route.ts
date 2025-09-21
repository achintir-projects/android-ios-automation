import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    // Build app filter
    const appFilter = appId ? { appId } : {};

    // Get overall analytics
    const [
      totalFeedback,
      avgRating,
      sentimentDistribution,
      typeDistribution,
      categoryDistribution,
      dailyTrends,
      topKeywords
    ] = await Promise.all([
      // Total feedback count
      db.feedback.count({
        where: { ...appFilter, ...dateFilter }
      }),

      // Average rating
      db.feedback.aggregate({
        where: { ...appFilter, ...dateFilter, rating: { not: null } },
        _avg: { rating: true }
      }),

      // Sentiment distribution
      db.feedback.groupBy({
        by: ['sentiment'],
        where: { ...appFilter, ...dateFilter, sentiment: { not: null } },
        _count: { sentiment: true }
      }),

      // Type distribution
      db.feedback.groupBy({
        by: ['type'],
        where: { ...appFilter, ...dateFilter },
        _count: { type: true }
      }),

      // Category distribution
      db.feedback.groupBy({
        by: ['category'],
        where: { ...appFilter, ...dateFilter },
        _count: { category: true }
      }),

      // Daily trends (last 30 days)
      db.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count,
          AVG(rating) as avg_rating,
          SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
          SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative,
          SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral
        FROM feedback 
        WHERE ${appId ? `app_id = ${appId} AND` : ''} 
          created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      ` as Array<{
        date: Date;
        count: number;
        avg_rating: number;
        positive: number;
        negative: number;
        neutral: number;
      }>,

      // Top keywords
      db.$queryRaw`
        SELECT 
          keyword,
          COUNT(*) as frequency
        FROM (
          SELECT json_each.value as keyword
          FROM feedback, json_each(feedback.keywords)
          WHERE ${appId ? `app_id = ${appId} AND` : ''} 
            json_each.value IS NOT NULL
            ${startDate ? `AND created_at >= ${startDate}` : ''}
            ${endDate ? `AND created_at <= ${endDate}` : ''}
        ) as keywords
        GROUP BY keyword
        ORDER BY frequency DESC
        LIMIT 10
      ` as Array<{
        keyword: string;
        frequency: number;
      }>
    ]);

    // Calculate response rate
    const processedCount = await db.feedback.count({
      where: { ...appFilter, ...dateFilter, status: 'processed' }
    });
    const responseRate = totalFeedback > 0 ? (processedCount / totalFeedback) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalFeedback,
          avgRating: avgRating._avg.rating || 0,
          responseRate: Math.round(responseRate * 100) / 100
        },
        sentimentDistribution: sentimentDistribution.reduce((acc, item) => {
          acc[item.sentiment || 'unknown'] = item._count.sentiment;
          return acc;
        }, {} as Record<string, number>),
        typeDistribution: typeDistribution.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        categoryDistribution: categoryDistribution.reduce((acc, item) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {} as Record<string, number>),
        dailyTrends: dailyTrends.map(trend => ({
          date: trend.date.toISOString().split('T')[0],
          count: trend.count,
          avgRating: Math.round((trend.avg_rating || 0) * 100) / 100,
          sentiment: {
            positive: trend.positive,
            negative: trend.negative,
            neutral: trend.neutral
          }
        })),
        topKeywords: topKeywords.map(item => ({
          keyword: item.keyword,
          frequency: item.frequency
        }))
      }
    });
  } catch (error) {
    console.error('Feedback analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}