"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import { ReactComponent as LogoVertical } from "/icons/logoVertical.svg";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle OAuth callback with session data
    const sessionToken = searchParams.get('session_token');
    const userEmail = searchParams.get('user_email');
    const userName = searchParams.get('user_name');
    
    if (sessionToken && userEmail) {
      // Store session data and redirect
      localStorage.setItem('session_token', sessionToken);
      localStorage.setItem('user_email', userEmail);
      localStorage.setItem('user', JSON.stringify({
        email: userEmail,
        name: userName || userEmail
      }));
      
      console.log('✅ Session established, redirecting to analytics...');
      router.push('/analytics');
      return;
    }

    // Handle error messages
    const errorParam = searchParams.get('error');
    if (errorParam) {
      switch (errorParam) {
        case 'oauth_error':
          setError('Microsoft authentication failed. Please try again.');
          break;
        case 'no_code':
          setError('Authentication was cancelled. Please try again.');
          break;
        case 'auth_failed':
          setError('Authentication failed. Please try again.');
          break;
        default:
          setError(decodeURIComponent(errorParam));
      }
    }
  }, [searchParams, router]);

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Real Microsoft OAuth login
      console.log('🔄 Starting Microsoft authentication...');
      
      // Redirect to Microsoft OAuth
      const microsoftAuthUrl = `/api/auth/microsoft/login`;
      window.location.href = microsoftAuthUrl;
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div 
      className="h-screen w-screen relative bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ 
        backgroundImage: `url('/blur_bg.png')`,
        backgroundColor: '#1a1a2e'
      }}
    >

      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-logoBlack bg-opacity-50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
          {/* Central App Icon */}
          <div className="flex justify-center items-center mb-4 sm:mb-6 md:mb-8 w-full">
            <img 
              src="/icons/logoVertical.svg"
              alt="Logo"
              className="w-24 sm:w-32 md:w-36 h-auto mx-auto" 
            />
          </div>


          {error && (
            <div className="text-center mb-4">
              <p className="text-red-400 text-xs sm:text-sm bg-red-900 bg-opacity-20 p-2 rounded">
                {error}
              </p>
            </div>
          )}

          {/* Sign in text */}
          <div className="text-center mb-6">
            <p className="text-white text-sm sm:text-base opacity-90">
              Sign in with your Microsoft Account
            </p>
            <p className="text-white text-xs opacity-70 mt-2">
              Your Microsoft account will be verified against JIRA access
            </p>
          </div>

          {/* Microsoft Sign In Button */}
          <button
            onClick={handleMicrosoftLogin}
            disabled={loading}
            className="w-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm text-sm sm:text-base"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M0 0h9v9H0V0z" fill="#F25022"/>
                  <path d="M11 0h9v9h-9V0z" fill="#7FBA00"/>
                  <path d="M0 11h9v9H0v-9z" fill="#00A4EF"/>
                  <path d="M11 11h9v9h-9v-9z" fill="#FFB900"/>
                </svg>
                Sign in with Microsoft
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}