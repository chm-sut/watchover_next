"use client";
import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface AnalyticsData {
  totalTickets: number;
  activeTickets: number;
  avgResponseTime: number;
  todayTickets: number;
  commentsToday: number;
  priorityDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  topCustomers: Array<{customer: string, count: number}>;
}

// Animated counter component
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}{suffix}</span>;
}

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('/api/analytics/dashboard');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          console.error('Failed to fetch analytics:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto rounded-2xl">
        <div className="bg-black bg-opacity-10 h-full rounded-2xl p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <h2 className="text-h6 text-logoWhite mb-2 font-heading">Loading Analytics...</h2>
            <p className="text-darkWhite text-sm">Calculating insights from your data</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 overflow-auto rounded-2xl">
        <div className="bg-black bg-opacity-10 h-full rounded-2xl p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-h6 text-logoWhite mb-2 font-heading">No Data Available</h2>
            <p className="text-darkWhite text-sm">Unable to load analytics data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto rounded-2xl">
      <div className="bg-black bg-opacity-10 h-full rounded-2xl p-6 space-y-6">
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tickets */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="text-darkWhite text-sm font-medium">Total Tickets</div>
            </div>
            <div className="text-logoWhite text-3xl font-bold mb-2">
              <AnimatedCounter value={analytics.totalTickets} />
            </div>
            <div className="text-blue-300 text-xs">All time collection</div>
          </div>
          
          {/* Active Tickets */}
          <div className="bg-gradient-to-br from-orange-600/20 to-red-800/20 backdrop-blur-sm rounded-xl p-6 border border-orange-400/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/30 rounded-lg flex items-center justify-center ">
                <svg className="w-6 h-6 text-orange-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-darkWhite text-sm font-medium">Active Tickets</div>
            </div>
            <div className="text-logoWhite text-3xl font-bold mb-2">
              <AnimatedCounter value={analytics.activeTickets} />
            </div>
            <div className="text-orange-300 text-xs">Currently in progress</div>
          </div>
          
          {/* Avg Wait Time */}
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-800/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/30 rounded-lg flex items-center justify-center ">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-darkWhite text-sm font-medium">Avg Wait Time</div>
            </div>
            <div className="text-logoWhite text-3xl font-bold mb-2">
              <AnimatedCounter value={analytics.avgResponseTime} suffix="h" />
            </div>
            <div className="text-purple-300 text-xs">Average response time</div>
          </div>
          
          {/* Today's Activity */}
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-800/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/30 rounded-lg flex items-center justify-center ">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-darkWhite text-sm font-medium">Today's Activity</div>
            </div>
            <div className="text-logoWhite text-3xl font-bold mb-2">
              <AnimatedCounter value={analytics.todayTickets + analytics.commentsToday} />
            </div>
            <div className="text-green-300 text-xs">{analytics.todayTickets} tickets + {analytics.commentsToday} comments</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Priority Distribution */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-logoBlue/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-logoBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-logoWhite text-lg font-semibold">Priority Distribution</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(analytics.priorityDistribution).map(([priority, count], index) => {
                const priorityColors = {
                  'Critical': 'from-lightRed to-logoRed',
                  'High': 'from-lightOrange to-orange-600',
                  'Medium': 'from-lightYellow to-yellow-600',
                  'Low': 'from-lightGreen to-green-600',
                  'Lowest': 'from-darkWhite to-gray-600'
                };
                const maxCount = Math.max(...Object.values(analytics.priorityDistribution));
                const percentage = (count / maxCount) * 100;
                
                return (
                  <div key={priority} className="group hover:bg-white hover:bg-opacity-5 p-3 rounded-lg transition-all duration-300">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-darkWhite font-medium">{priority}</span>
                      <span className="text-logoWhite font-bold text-lg">
                        <AnimatedCounter value={count} />
                      </span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full bg-gradient-to-r ${priorityColors[priority as keyof typeof priorityColors] || 'from-logoBlue to-blue-500'} transition-all duration-1000 ease-out`}
                        style={{
                          width: `${percentage}%`,
                          animationDelay: `${index * 200}ms`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-logoWhite text-lg font-semibold">Status Overview</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(analytics.statusDistribution).map(([status, count], index) => {
                const maxCount = Math.max(...Object.values(analytics.statusDistribution));
                const percentage = (count / maxCount) * 100;
                
                // Color coding for different statuses
                const getStatusColor = (status: string) => {
                  if (status === 'Closed') {
                    return {
                      dot: 'bg-lightGreen',
                      bar: 'bg-gradient-to-r from-lightGreen to-green-400'
                    };
                  } else if (status === 'Waiting') {
                    return {
                      dot: 'bg-lightYellow',
                      bar: 'bg-gradient-to-r from-lightYellow to-yellow-400'
                    };
                  } else if (status === 'Open') {
                    return {
                      dot: 'bg-lightOrange',
                      bar: 'bg-gradient-to-r from-lightOrange to-orange-400'
                    };
                  } else {
                    // Neutral for In Progress, Resolved and others
                    return {
                      dot: 'bg-darkWhite',
                      bar: 'bg-gradient-to-r from-darkWhite to-gray-400'
                    };
                  }
                };
                
                const statusColors = getStatusColor(status);
                
                return (
                  <div key={status} className="group hover:bg-white hover:bg-opacity-5 p-3 rounded-lg transition-all duration-300">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${statusColors.dot} animate-pulse`}></div>
                        <span className="text-darkWhite font-medium">{status}</span>
                      </div>
                      <span className="text-logoWhite font-bold text-lg">
                        <AnimatedCounter value={count} />
                      </span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${statusColors.bar}`}
                        style={{
                          width: `${percentage}%`,
                          animationDelay: `${index * 200}ms`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-yellow-500/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-logoWhite text-lg font-semibold">Most Active Customers</h3>
          </div>
          <div className="space-y-3">
            {analytics.topCustomers.slice(0, 10).map(({customer, count}, index) => (
              <div key={customer} className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-logoBlue/30 rounded-full flex items-center justify-center">
                    <span className="text-logoWhite font-bold text-sm">
                      {customer.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-logoWhite font-medium">{customer}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 bg-gray-700/50 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-logoBlue to-blue-400 transition-all duration-1000 ease-out"
                      style={{
                        width: `${index === 0 ? 100 : (count / analytics.topCustomers[0].count) * 100}%`,
                        animationDelay: `${index * 100}ms`
                      }}
                    ></div>
                  </div>
                  <span className="text-logoWhite font-bold text-lg min-w-[3rem] text-right">
                    <AnimatedCounter value={count} />
                  </span>
                </div>
              </div>
            ))}
          </div>
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