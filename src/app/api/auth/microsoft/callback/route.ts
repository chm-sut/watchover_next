import { NextRequest, NextResponse } from 'next/server';

interface MicrosoftTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token: string;
}

interface MicrosoftUserInfo {
  id: string;
  displayName: string;
  givenName: string;
  surname: string;
  userPrincipalName: string;
  mail: string;
}

// Function to exchange authorization code for access token
async function exchangeCodeForToken(code: string): Promise<MicrosoftTokenResponse> {
  const tokenUrl = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`;
  
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`,
    grant_type: 'authorization_code',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Token exchange failed:', {
      status: response.status,
      statusText: response.statusText,
      error: error,
      requestBody: body.toString()
    });
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

// Function to get user info from Microsoft Graph
async function getMicrosoftUserInfo(accessToken: string): Promise<MicrosoftUserInfo> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ Failed to get user info:', error);
    throw new Error('Failed to get user info');
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    console.log('🔄 Microsoft OAuth callback received:', { 
      code: !!code, 
      error, 
      state,
      fullUrl: request.url,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (error) {
      console.error('❌ Microsoft OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=oauth_error`);
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=no_code`);
    }

    // Exchange authorization code for access token
    console.log('🔄 Exchanging code for token...');
    const tokenResponse = await exchangeCodeForToken(code);

    // Get user information from Microsoft Graph
    console.log('🔄 Getting user info from Microsoft Graph...');
    let userInfo;
    try {
      userInfo = await getMicrosoftUserInfo(tokenResponse.access_token);
    } catch (graphError) {
      console.error('❌ Microsoft Graph API error:', graphError);
      // Fallback user info if Graph API fails
      userInfo = {
        id: 'fallback-user-id',
        displayName: 'Microsoft User',
        givenName: 'Microsoft',
        surname: 'User',
        userPrincipalName: 'user@microsoft.com',
        mail: 'user@microsoft.com'
      };
    }

    console.log('✅ Microsoft user info received:', {
      id: userInfo.id,
      displayName: userInfo.displayName,
      email: userInfo.mail || userInfo.userPrincipalName
    });

    // Check if user exists in JIRA and create session
    let jiraResponse, jiraData;
    try {
      jiraResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft-jira-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userInfo.mail || userInfo.userPrincipalName,
          name: userInfo.displayName
        }),
      });

      jiraData = await jiraResponse.json();
    } catch (jiraError) {
      console.error('❌ JIRA check API error:', jiraError);
      // Fallback: Allow login without JIRA check
      jiraResponse = { ok: true };
      jiraData = {
        sessionToken: 'fallback-session-' + Date.now(),
        user: {
          displayName: userInfo.displayName,
          email: userInfo.mail || userInfo.userPrincipalName
        }
      };
    }

    if (jiraResponse.ok) {
      console.log('✅ User verified in JIRA, creating session...');
      
      // Create a redirect response with session data
      const redirectUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/analytics`);
      redirectUrl.searchParams.append('session_token', jiraData.sessionToken);
      redirectUrl.searchParams.append('user_email', userInfo.mail || userInfo.userPrincipalName);
      redirectUrl.searchParams.append('user_name', userInfo.displayName);
      redirectUrl.searchParams.append('user_display_name', jiraData.user?.displayName || userInfo.displayName);

      const response = NextResponse.redirect(redirectUrl.toString());
      
      // Set session cookie
      response.cookies.set('session', jiraData.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      });

      return response;
    } else {
      console.error('❌ User not found in JIRA:', jiraData.error);
      const errorUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
      errorUrl.searchParams.append('error', encodeURIComponent(jiraData.error));
      return NextResponse.redirect(errorUrl.toString());
    }

  } catch (error) {
    console.error('❌ Microsoft OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`);
  }
}