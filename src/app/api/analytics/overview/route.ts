import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    // Get comprehensive analytics data
    const [
      totalApps,
      totalUsers,
      totalFeedback,
      totalDeployments,
      avgRating,
      revenueData,
      userGrowth,
      appPerformance
    ] = await Promise.all([
      // Total apps created
      db.savedApp.count({
        where: { ...dateFilter }
      }),

      // Total users (simplified - in real app would use User table)
      db.savedApp.groupBy({
        by: ['domain'],
        _count: { domain: true },
        where: { ...dateFilter }
      }),

      // Total feedback
      db.feedback.count({
        where: { ...dateFilter }
      }),

      // Total deployments (simplified)
      db.savedApp.count({
        where: { 
          ...dateFilter,
          isTemplate: false
        }
      }),

      // Average rating
      db.feedback.aggregate({
        where: { 
          ...dateFilter,
          rating: { not: null }
        },
        _avg: { rating: true }
      }),

      // Revenue data (simplified)
      db.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as apps_created,
          SUM(CASE WHEN is_template = false THEN 1 ELSE 0 END) as paid_apps
        FROM saved_app 
        WHERE ${startDate ? `created_at >= ${startDate} AND` : ''} 
          ${endDate ? `created_at <= ${endDate} AND` : ''}
          created_at >= DATETIME('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      ` as Array<{
        date: Date;
        apps_created: number;
        paid_apps: number;
      }>,

      // User growth
      db.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_users
        FROM saved_app 
        WHERE ${startDate ? `created_at >= ${startDate} AND` : ''} 
          ${endDate ? `created_at <= ${endDate} AND` : ''}
          created_at >= DATETIME('now', '-30 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      ` as Array<{
        date: Date;
        new_users: number;
      }>,

      // App performance metrics
      db.$queryRaw`
        SELECT 
          domain,
          COUNT(*) as app_count,
          AVG(JSON_EXTRACT(requirements, '$.length')) as avg_requirements,
          AVG(JSON_EXTRACT(specifications, '$.length')) as avg_specifications
        FROM saved_app 
        WHERE ${startDate ? `created_at >= ${startDate} AND` : ''} 
          ${endDate ? `created_at <= ${endDate} AND` : ''}
          is_template = false
        GROUP BY domain
        ORDER BY app_count DESC
        LIMIT 10
      ` as Array<{
        domain: string;
        app_count: number;
        avg_requirements: number;
        avg_specifications: number;
      }>
    ]);

    // Calculate derived metrics
    const totalUserCount = userGrowth.reduce((sum, item) => sum + item.new_users, 0);
    const systemHealthScore = 95; // Simplified - would come from monitoring system

    // Calculate growth rates
    const currentPeriod = revenueData.slice(0, 7);
    const previousPeriod = revenueData.slice(7, 14);
    
    const currentApps = currentPeriod.reduce((sum, item) => sum + item.apps_created, 0);
    const previousApps = previousPeriod.reduce((sum, item) => sum + item.apps_created, 0);
    const appGrowthRate = previousApps > 0 ? ((currentApps - previousApps) / previousApps) * 100 : 0;

    const currentUsers = currentPeriod.reduce((sum, item) => sum + item.new_users, 0);
    const previousUsers = previousPeriod.reduce((sum, item) => sum + item.new_users, 0);
    const userGrowthRate = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

    // Calculate revenue (simplified)
    const estimatedRevenue = totalDeployments * 99; // $99 per deployment
    const revenueGrowthRate = appGrowthRate; // Simplified

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalApps,
          totalUsers: totalUserCount,
          totalFeedback,
          totalDeployments,
          avgRating: avgRating._avg.rating || 0,
          systemHealth: systemHealthScore,
          estimatedRevenue
        },
        growth: {
          appGrowthRate: Math.round(appGrowthRate * 100) / 100,
          userGrowthRate: Math.round(userGrowthRate * 100) / 100,
          revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100
        },
        performance: {
          topDomains: appPerformance,
          avgRequirements: appPerformance.length > 0 
            ? Math.round(appPerformance.reduce((sum, item) => sum + item.avg_requirements, 0) / appPerformance.length)
            : 0,
          avgSpecifications: appPerformance.length > 0 
            ? Math.round(appPerformance.reduce((sum, item) => sum + item.avg_specifications, 0) / appPerformance.length)
            : 0
        },
        trends: {
          revenue: revenueData.map(item => ({
            date: item.date.toISOString().split('T')[0],
            apps: item.apps_created,
            paidApps: item.paid_apps
          })),
          userGrowth: userGrowth.map(item => ({
            date: item.date.toISOString().split('T')[0],
            newUsers: item.new_users
          }))
        }
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}