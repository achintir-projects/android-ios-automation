import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      severity,
      title,
      message,
      source,
      metadata = {},
      channels = ['email']
    } = body;

    // Validate required fields
    if (!type || !severity || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, severity, title, message' },
        { status: 400 }
      );
    }

    // Create alert
    const alert = await db.alert.create({
      data: {
        type,
        severity,
        title,
        message,
        source: source || 'system',
        metadata: JSON.stringify(metadata),
        channels: JSON.stringify(channels),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Trigger alert processing (async)
    processAlertAsync(alert.id);

    return NextResponse.json({
      success: true,
      data: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        createdAt: alert.createdAt
      }
    });
  } catch (error) {
    console.error('Alert creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processAlertAsync(alertId: string) {
  try {
    // Simulate async processing - in a real implementation, this would use a message queue
    setTimeout(async () => {
      try {
        const alert = await db.alert.findUnique({
          where: { id: alertId }
        });

        if (!alert) return;

        // Send notifications based on channels
        const channels = JSON.parse(alert.channels || '[]');
        
        for (const channel of channels) {
          await sendNotification(alert, channel);
        }

        // Update alert status
        await db.alert.update({
          where: { id: alertId },
          data: {
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date()
          }
        });
      } catch (error) {
        console.error('Alert processing error:', error);
        await db.alert.update({
          where: { id: alertId },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date()
          }
        });
      }
    }, 1000);
  } catch (error) {
    console.error('Async alert processing error:', error);
  }
}

async function sendNotification(alert: any, channel: string) {
  // Simulate sending notification
  console.log(`Sending ${channel} notification for alert ${alert.id}: ${alert.title}`);
  
  // In a real implementation, this would integrate with:
  // - Email service (SendGrid, AWS SES)
  // - SMS service (Twilio)
  // - Push notifications (Firebase, APNS)
  // - Slack/Teams webhooks
  // - PagerDuty
  
  // Create notification record
  await db.notification.create({
    data: {
      alertId: alert.id,
      channel,
      status: 'sent',
      sentAt: new Date(),
      metadata: JSON.stringify({
        recipient: getChannelRecipient(channel),
        template: getChannelTemplate(channel, alert)
      })
    }
  });
}

function getChannelRecipient(channel: string): string {
  switch (channel) {
    case 'email': return 'admin@example.com';
    case 'sms': return '+1234567890';
    case 'slack': return '#alerts';
    case 'pagerduty': return 'admin';
    default: return 'system';
  }
}

function getChannelTemplate(channel: string, alert: any): string {
  const severityColors = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  };

  switch (channel) {
    case 'email':
      return `
        <h2>${severityColors[alert.severity as keyof typeof severityColors] || '⚪'} ${alert.title}</h2>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${alert.createdAt}</p>
      `;
    case 'slack':
      return `${severityColors[alert.severity as keyof typeof severityColors] || '⚪'} *${alert.title}*\n${alert.message}`;
    case 'sms':
      return `ALERT: ${alert.title} - ${alert.message}`;
    default:
      return `${alert.title}: ${alert.message}`;
  }
}