import { NextRequest, NextResponse } from 'next/server';

// GET method for webhook verification
export async function GET() {
  console.log('🔗 LINE webhook verification request received');
  return NextResponse.json({ status: 'Webhook is active' });
}

// Temporary webhook to get User ID - remove after getting your ID
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 WEBHOOK RECEIVED! Processing LINE message...');
    const body = await request.json();
    
    // Log the webhook data to see user ID
    console.log('📦 LINE Webhook received:', JSON.stringify(body, null, 2));
    
    if (body.events && body.events.length > 0) {
      const event = body.events[0];
      
      if (event.type === 'message') {
        const userId = event.source.userId;
        const groupId = event.source.groupId;
        const roomId = event.source.roomId;
        
        console.log('=================================');
        console.log('🔥 YOUR LINE IDs:');
        console.log('👤 User ID:', userId);
        console.log('👥 GROUP ID:', groupId);
        console.log('🏠 Room ID:', roomId);
        console.log('=================================');
        
        if (groupId) {
          console.log('🎯 COPY THIS GROUP ID FOR YOUR .env.local:');
          console.log(`LINE_GROUP_ID=${groupId}`);
          console.log('=================================');
        }
        
        // Auto-reply disabled - bot will not respond to group messages anymore
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}