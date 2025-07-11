import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Microsoft OAuth 2.0 configuration
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.TENANT_ID;
    // https://fb618e1d6445.ngrok-free.app/api/auth/microsoft/callback
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`;
    const scope = 'openid profile email User.Read';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Microsoft OAuth not configured' },
        { status: 500 }
      );
    }

    // Create Microsoft OAuth URL
    const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('response_mode', 'query');
    authUrl.searchParams.append('state', 'login'); // Add state for security

    console.log('🔄 Redirecting to Microsoft OAuth:', authUrl.toString());
    console.log('🔍 Config check:', {
      clientId: clientId ? 'SET' : 'MISSING',
      tenantId: tenantId ? 'SET' : 'MISSING',
      redirectUri,
      expectedCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/microsoft/callback`
    });

    // Redirect to Microsoft OAuth
    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('❌ Microsoft OAuth redirect error:', error);
    return NextResponse.json(
      { error: 'OAuth redirect failed' },
      { status: 500 }
    );
  }
}