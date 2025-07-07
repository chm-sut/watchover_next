"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
// import { ReactComponent as LogoVertical } from "/icons/logoVertical.svg";
import { getCurrentUser } from "../utils/mockAuth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMode, setLoginMode] = useState<'microsoft' | 'credentials'>('microsoft');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate async login delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = getCurrentUser();
      // Store user in localStorage or session storage
      localStorage.setItem('user', JSON.stringify(user));
      // Navigate to dashboard or main app
      router.push('/analytics');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Simulate async login delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simple mock validation
      if (username === 'admin' && password === 'admin123') {
        const user = getCurrentUser();
        // Store user in localStorage or session storage
        localStorage.setItem('user', JSON.stringify(user));
        // Navigate to dashboard or main app
        router.push('/analytics');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <div 
      className="h-screen w-screen relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/blur_bg.png')` }}
    >

      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg bg-logoBlack bg-opacity-50 backdrop-blur-sm rounded-4xl sm:rounded-5xl p-6 sm:p-8 md:p-10 lg:p-12">
          {/* Central App Icon */}
          <div className="flex justify-center items-center mb-6 sm:mb-8 md:mb-10 w-full">
            <div className="flex justify-center items-center">
              <img 
                src="/icons/logoVertical.svg"
                alt="Logo"
                className="max-w-none block mx-auto" 
                style={{ 
                  width: '150px',
                  height: 'auto',
                  transform: 'scale(1.2)',
                  display: 'block',
                  margin: '0 auto'
                }} 
              />
            </div>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex bg-white bg-opacity-10 rounded-lg p-1 mb-6">
            <button
              onClick={() => setLoginMode('microsoft')}
              className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                loginMode === 'microsoft'
                  ? 'bg-white text-gray-800'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Microsoft
            </button>
            <button
              onClick={() => setLoginMode('credentials')}
              className={`flex-1 py-2 px-3 rounded-md text-sm transition-all ${
                loginMode === 'credentials'
                  ? 'bg-white text-gray-800'
                  : 'text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              Username
            </button>
          </div>

          {error && (
            <div className="text-center mb-4">
              <p className="text-red-400 text-xs sm:text-sm bg-red-900 bg-opacity-20 p-2 rounded">
                {error}
              </p>
            </div>
          )}

          {loginMode === 'microsoft' ? (
            <>
              {/* Sign in text */}
              <div className="text-center mb-6">
                <p className="text-white text-sm sm:text-base opacity-90">
                  Sign in with your Microsoft Account
                </p>
              </div>

              {/* Microsoft Sign In Button */}
              <button
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="w-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm text-sm sm:text-base"
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
            </>
          ) : (
            <>
              {/* Credentials Form */}
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div>
                  <label className="block text-white text-sm mb-2">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-white bg-opacity-90 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    placeholder="Enter username"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-white text-sm mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white bg-opacity-90 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    placeholder="Enter password"
                    disabled={loading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 font-medium py-2 sm:py-3 px-3 sm:px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800"></div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
              
              {/* Demo Credentials */}
              <div className="mt-4 p-3 bg-white bg-opacity-10 rounded-lg">
                <p className="text-white text-xs opacity-80 mb-2">Demo credentials:</p>
                <p className="text-white text-xs">admin / admin123</p>
                <p className="text-white text-xs">sarah.wilson / password123</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}