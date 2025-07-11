"use client";
import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Handle session data from Microsoft OAuth callback
    const sessionToken = searchParams.get('session_token');
    const userEmail = searchParams.get('user_email');
    const userName = searchParams.get('user_name');
    const userDisplayName = searchParams.get('user_display_name');

    if (sessionToken && userEmail) {
      // Store session data in localStorage
      localStorage.setItem('session_token', sessionToken);
      localStorage.setItem('user_email', userEmail);
      if (userName) {
        localStorage.setItem('user_name', userName);
      }
      if (userDisplayName) {
        localStorage.setItem('user_display_name', userDisplayName);
      }

      // Clean up URL parameters and navigate to clean URL
      router.replace('/analytics');
    }
  }, [searchParams, router]);

  return (
    <div className="flex-1 overflow-auto rounded-2xl">
      <div className="bg-black bg-opacity-10 h-full rounded-2xl p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-logoWhite mb-4 font-heading">Analytics</h1>
          <p className="text-darkWhite">Analytics content coming soon...</p>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}