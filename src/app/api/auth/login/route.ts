import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface LoginRequest {
  email: string;
  password?: string;
  apiToken?: string;
}

// Function to verify JIRA credentials with multiple authentication methods
async function verifyJiraCredentials(email: string, password: string): Promise<boolean> {
  const auth = Buffer.from(`${email}:${password}`).toString('base64');
  const baseUrl = process.env.JIRA_BASE_URL;
  
  console.log('🔍 Attempting JIRA authentication for:', email);
  console.log('🔑 JIRA_BASE_URL from env:', baseUrl);
  console.log('🔐 Auth string before base64:', `${email}:${password.substring(0, 3)}***`);
  
  // Try different endpoints and methods
  const endpoints = [
    `${baseUrl}rest/api/3/user/search?query=${encodeURIComponent(email)}`
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log('🔗 Trying endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      console.log('📡 JIRA API Response:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ JIRA Authentication successful for:', userData.emailAddress || userData.name || 'User');
        return true;
      } else {
        await response.text();
        console.log('❌ Failed on endpoint:', endpoint, 'Status:', response.status);
      }
    } catch (error) {
      console.error('❌ Error on endpoint:', endpoint, error);
    }
  }
  
  console.error('❌ All authentication methods failed');
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, apiToken }: LoginRequest = await request.json();
    
    const credential = password || apiToken;
    const credentialType = password ? 'password' : 'API token';

    if (!email || !credential) {
      return NextResponse.json(
        { error: `Email and ${credentialType} are required` },
        { status: 400 }
      );
    }

    // Verify the JIRA credentials
    const isValidCredentials = await verifyJiraCredentials(email, credential);
    
    if (!isValidCredentials) {
      return NextResponse.json(
        { error: `Invalid JIRA credentials. Please check your email and ${credentialType}.` },
        { status: 401 }
      );
    }

    // Create a session token
    const sessionSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    const sessionToken = jwt.sign(
      { 
        email, 
        jiraCredential: credential, // Store encrypted in production
        credentialType,
        loginTime: Date.now() 
      },
      sessionSecret,
      { expiresIn: '24h' }
    );

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      sessionToken,
      user: { email }
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}