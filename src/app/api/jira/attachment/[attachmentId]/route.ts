import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ attachmentId: string }> }
) {
  const { attachmentId } = await context.params;

  console.log('JIRA Attachment API called:', { attachmentId });

  try {
    const jiraUrl = process.env.JIRA_URL || process.env.JIRA_BASE_URL;
    const jiraEmail = process.env.JIRA_EMAIL;
    const jiraToken = process.env.JIRA_TOKEN || process.env.JIRA_API_TOKEN;

    console.log('Environment check:', {
      hasJiraUrl: !!jiraUrl,
      hasJiraEmail: !!jiraEmail,
      hasJiraToken: !!jiraToken,
      jiraUrl: jiraUrl ? jiraUrl.substring(0, 50) + '...' : 'undefined'
    });

    if (!jiraUrl || !jiraEmail || !jiraToken) {
      console.error('Missing JIRA credentials');
      return NextResponse.json({ error: 'JIRA credentials not configured' }, { status: 500 });
    }

    const attachmentUrl = `${jiraUrl}/rest/api/3/attachment/content/${attachmentId}`;

    const jiraResponse = await fetch(attachmentUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64')}`,
        'Accept': '*/*',
      },
    });

    if (!jiraResponse.ok) {
      console.error(`JIRA attachment fetch failed: ${jiraResponse.status} ${jiraResponse.statusText}`);
      return NextResponse.json({ 
        error: `Failed to fetch attachment: ${jiraResponse.status} ${jiraResponse.statusText}` 
      }, { status: jiraResponse.status });
    }

    const buffer = await jiraResponse.arrayBuffer();
    const contentType = jiraResponse.headers.get('content-type') || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error proxying JIRA attachment:', {
      attachmentId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      jiraUrl: process.env.JIRA_URL,
      hasCredentials: !!(process.env.JIRA_EMAIL && process.env.JIRA_TOKEN)
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      attachmentId 
    }, { status: 500 });
  }
}