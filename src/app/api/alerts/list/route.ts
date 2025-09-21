import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (source) where.source = source;

    // Get alerts with pagination
    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit,
        include: {
          notifications: true
        }
      }),
      db.alert.count({ where })
    ]);

    // Parse JSON fields
    const processedAlerts = alerts.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : {},
      channels: item.channels ? JSON.parse(item.channels) : [],
      notifications: item.notifications.map((notification: any) => ({
        ...notification,
        metadata: notification.metadata ? JSON.parse(notification.metadata) : {}
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        alerts: processedAlerts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Alerts list error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}