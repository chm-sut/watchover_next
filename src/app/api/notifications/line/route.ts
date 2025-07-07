import { NextRequest, NextResponse } from 'next/server';

interface LineNotificationRequest {
  ticketCode: string;
  ticketName: string;
  escalationLevel: string;
  priority: string;
  customer: string;
  previousLevel?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      ticketCode,
      ticketName,
      escalationLevel,
      priority,
      customer,
      previousLevel,
      message
    }: LineNotificationRequest = await request.json();

    // LINE Bot credentials - add these to your .env.local
    const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const LINE_GROUP_LV1 = process.env.LINE_GROUP_LV1;
    const LINE_GROUP_LV2 = process.env.LINE_GROUP_LV2;
    const LINE_USER_ID = process.env.LINE_USER_ID?.replace('@', ''); // Fallback to user ID

    // Select target based on escalation level
    let targetId: string;
    let targetType: string;
    
    if (escalationLevel === 'Lv.2' && LINE_GROUP_LV2) {
      targetId = LINE_GROUP_LV2;
      targetType = 'Senior Team (Lv.2)';
    } else if (escalationLevel === 'Lv.1' && LINE_GROUP_LV1) {
      targetId = LINE_GROUP_LV1;
      targetType = 'Support Team (Lv.1)';
    } else if (LINE_USER_ID) {
      targetId = LINE_USER_ID;
      targetType = 'Individual User';
    } else {
      return NextResponse.json(
        { error: 'No valid LINE target configured for this escalation level' },
        { status: 500 }
      );
    }

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'LINE Channel Access Token not configured' },
        { status: 500 }
      );
    }

    // Determine escalation emoji and urgency
    const getEscalationEmoji = (level: string) => {
      switch (level) {
        case 'Lv.2': return '🔴';
        case 'Lv.1': return '🟠';
        case 'None': return '⚪️';
        default: return '🔘';
      }
    };

    const escalationEmoji = getEscalationEmoji(escalationLevel);
    const previousEmoji = previousLevel ? getEscalationEmoji(previousLevel) : '';

    // Create clickable link to ticket details
    const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/ticket/ticket-info?ticketCode=${ticketCode}`;

    // Create LINE message
    const lineMessage = {
      type: 'text',
      text: `🚨 ESCALATION ALERT 🚨\n\n` +
            `${escalationEmoji} Level: ${escalationLevel}\n` +
            (previousLevel ? `${previousEmoji} Previous: ${previousLevel}\n\n` : '\n') +
            `🎫 Ticket: ${ticketCode}\n` +
            `📋 Name: ${ticketName}\n` +
            `⚡ Priority: ${priority}\n` +
            `👤 Customer: ${customer}\n\n` +
            `${message || 'Please review this ticket immediately.'}\n\n` +
            `🔗 View Ticket: ${ticketUrl}\n\n` +
            `🕒 Time: ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })}`
    };

    // Send to LINE
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: targetId,
        messages: [lineMessage]
      })
    });

    if (!lineResponse.ok) {
      const errorData = await lineResponse.text();
      console.error('LINE API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send LINE message', details: errorData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'LINE notification sent successfully',
      escalationLevel,
      ticketCode,
      targetType
    });

  } catch (error) {
    console.error('LINE notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}