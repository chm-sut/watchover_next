import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

interface UserData {
  accountId: string;
  displayName: string;
  emailAddress: string;
  avatarUrls: unknown;
}

interface MicrosoftJiraRequest {
  email: string;
  name: string;
}

// Function to check if user exists in JIRA
async function checkUserInJira(email: string): Promise<{ exists: boolean; userData?: UserData }> {
  try {
    const jiraUrl = `${process.env.JIRA_BASE_URL}rest/api/3/user/search?query=${email}`;
    
    console.log('🔍 Checking JIRA user existence for:', email);
    console.log('🔗 JIRA URL:', jiraUrl);
    
    // Use the existing JIRA credentials for this check
    const serviceAuth = Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64');
    
    const response = await fetch(jiraUrl, {
      headers: {
        'Authorization': `Basic ${serviceAuth}`,
        'Accept': 'application/json',
      },
    });

    console.log('📡 JIRA Search Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ JIRA Search Error:', errorText);
      return { exists: false };
    }

    const users = await response.json();
    console.log('👥 JIRA Users found:', users.length);

    // If any user was found, allow login (simplified logic)
    if (users.length > 0) {
      const user = users[0]; // Use first user found
      console.log('✅ User found in JIRA:', {
        accountId: user.accountId,
        displayName: user.displayName,
        emailAddress: user.emailAddress
      });
      
      return { 
        exists: true, 
        userData: {
          accountId: user.accountId,
          displayName: user.displayName,
          emailAddress: user.emailAddress,
          avatarUrls: user.avatarUrls
        }
      };
    } else {
      console.log('❌ No users found in JIRA');
      return { exists: false };
    }

  } catch (error) {
    console.error('❌ JIRA user check failed:', error);
    console.log('⚠️ Allowing login due to network error (user authenticated with Microsoft)');
    
    // Fallback: Allow login with Microsoft user data if JIRA check fails
    return { 
      exists: true, 
      userData: {
        accountId: 'fallback-' + Date.now(),
        displayName: 'Microsoft User',
        emailAddress: email,
        avatarUrls: null
      }
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name }: MicrosoftJiraRequest = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Processing Microsoft + JIRA login for:', { email, name });

    // Check if user exists in JIRA
    const jiraCheck = await checkUserInJira(email);
    
    if (!jiraCheck.exists) {
      return NextResponse.json(
        { error: 'Access denied: Your Microsoft account is not authorized for JIRA access. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // Create a session token with both Microsoft and JIRA user data
    const sessionSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    console.log('🔑 Creating JWT token for user:', email);
    
    let sessionToken;
    try {
      sessionToken = jwt.sign(
        { 
          email,
          microsoftName: name,
          jiraUser: jiraCheck.userData,
          loginTime: Date.now(),
          loginMethod: 'microsoft-jira'
        },
        sessionSecret,
        { expiresIn: '24h' }
      );
      
      console.log('✅ JWT token created successfully');
    } catch (jwtError) {
      console.error('❌ JWT token creation failed:', jwtError);
      throw jwtError;
    }

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      sessionToken,
      user: {
        email,
        name,
        displayName: jiraCheck.userData?.displayName,
        accountId: jiraCheck.userData?.accountId,
        avatarUrls: jiraCheck.userData?.avatarUrls,
        loginMethod: 'microsoft-jira'
      }
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    console.log('✅ Microsoft + JIRA login successful for:', email);
    return response;

  } catch (error) {
    console.error('❌ Microsoft + JIRA login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}