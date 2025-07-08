"use client";
import { useState, useEffect } from 'react';

interface EscalationAnalytics {
  summary: {
    totalEscalations: number;
    escalationsSent: number;
    escalationsScheduled: number;
    escalationPreventionRate: number;
    avgTimeToEscalation: number;
    avgResponseTimeAfterEscalation: number;
  };
  breakdown: {
    byLevel: Record<string, number>;
    byPriority: Record<string, number>;
    byCustomer: [string, number][];
    byAssignee: [string, number][];
  };
  trends: {
    daily: { date: string; escalations: number }[];
  };
  pending: Array<{
    ticketId: string;
    level: string;
    scheduledTime: string;
    priority: string;
    customer: string;
    assignee: string;
    overdueDuration: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<EscalationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/escalations');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours: number): string => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return 'text-red-400';
      case 'HIGH': return 'text-orange-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto rounded-2xl">
        <div className="bg-black bg-opacity-10 h-full rounded-2xl p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-logoWhite">Loading escalation analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 overflow-auto rounded-2xl">
        <div className="bg-black bg-opacity-10 h-full rounded-2xl p-6 flex items-center justify-center">
          <p className="text-red-400">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto rounded-2xl">
      <div className="bg-black bg-opacity-10 h-full rounded-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="bg-logoBlack bg-opacity-20 rounded-lg p-6 border border-gray-600">
          <h1 className="text-2xl font-semibold text-logoWhite mb-2 font-heading">Escalation Analytics</h1>
          <p className="text-darkWhite">Comprehensive escalation metrics and insights</p>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-4 border border-gray-600">
            <h3 className="text-logoWhite font-semibold text-sm mb-2">Total Escalations</h3>
            <p className="text-2xl font-bold text-logoWhite">{analytics.summary.totalEscalations}</p>
            <p className="text-xs text-darkWhite">{analytics.summary.escalationsSent} sent</p>
          </div>

          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-4 border border-gray-600">
            <h3 className="text-logoWhite font-semibold text-sm mb-2">Prevention Rate</h3>
            <p className="text-2xl font-bold text-green-400">{analytics.summary.escalationPreventionRate}%</p>
            <p className="text-xs text-darkWhite">Tickets resolved without escalation</p>
          </div>

          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-4 border border-gray-600">
            <h3 className="text-logoWhite font-semibold text-sm mb-2">Avg Time to Escalation</h3>
            <p className="text-2xl font-bold text-orange-400">{formatDuration(analytics.summary.avgTimeToEscalation)}</p>
            <p className="text-xs text-darkWhite">From ticket creation</p>
          </div>

          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-4 border border-gray-600">
            <h3 className="text-logoWhite font-semibold text-sm mb-2">Avg Response Time</h3>
            <p className="text-2xl font-bold text-blue-400">{formatDuration(analytics.summary.avgResponseTimeAfterEscalation)}</p>
            <p className="text-xs text-darkWhite">After escalation sent</p>
          </div>

          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-4 border border-gray-600">
            <h3 className="text-logoWhite font-semibold text-sm mb-2">Pending Escalations</h3>
            <p className="text-2xl font-bold text-red-400">{analytics.pending.length}</p>
            <p className="text-xs text-darkWhite">Overdue notifications</p>
          </div>

          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-4 border border-gray-600">
            <h3 className="text-logoWhite font-semibold text-sm mb-2">Escalation Breakdown</h3>
            <div className="flex gap-4">
              <div>
                <p className="text-lg font-bold text-yellow-400">{analytics.breakdown.byLevel['Lv.1'] || 0}</p>
                <p className="text-xs text-darkWhite">Level 1</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-400">{analytics.breakdown.byLevel['Lv.2'] || 0}</p>
                <p className="text-xs text-darkWhite">Level 2</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Escalations by Priority */}
          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-6 border border-gray-600">
            <h3 className="text-logoWhite font-semibold mb-4">Escalations by Priority</h3>
            <div className="space-y-3">
              {Object.entries(analytics.breakdown.byPriority).map(([priority, count]) => (
                <div key={priority} className="flex justify-between items-center">
                  <span className={`${getPriorityColor(priority)} font-medium`}>{priority}</span>
                  <span className="text-logoWhite">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Customers with Escalations */}
          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-6 border border-gray-600">
            <h3 className="text-logoWhite font-semibold mb-4">Top Customers (Escalations)</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {analytics.breakdown.byCustomer.map(([customer, count], index) => (
                <div key={customer} className="flex justify-between items-center">
                  <span className="text-darkWhite text-sm truncate mr-2">
                    {index + 1}. {customer}
                  </span>
                  <span className="text-logoWhite">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Escalation Trends */}
          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-6 border border-gray-600 lg:col-span-2">
            <h3 className="text-logoWhite font-semibold mb-4">Daily Escalation Trends (Last 30 Days)</h3>
            <div className="flex items-end space-x-1 h-32">
              {analytics.trends.daily.map((day, index) => (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div 
                    className="bg-blue-500 w-full transition-all duration-300 hover:bg-blue-400"
                    style={{ height: `${Math.max((day.escalations / Math.max(...analytics.trends.daily.map(d => d.escalations), 1)) * 100, 2)}%` }}
                    title={`${day.date}: ${day.escalations} escalations`}
                  />
                  {index % 5 === 0 && (
                    <span className="text-xs text-darkWhite mt-1 transform rotate-45 origin-bottom-left">
                      {day.date.split('-').slice(1).join('/')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Top Assignees with Escalations */}
          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-6 border border-gray-600">
            <h3 className="text-logoWhite font-semibold mb-4">Top Assignees (Escalations)</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {analytics.breakdown.byAssignee.map(([assignee, count], index) => (
                <div key={assignee} className="flex justify-between items-center">
                  <span className="text-darkWhite text-sm truncate mr-2">
                    {index + 1}. {assignee}
                  </span>
                  <span className="text-logoWhite">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Escalations Table */}
          <div className="bg-logoBlack bg-opacity-20 rounded-lg p-6 border border-gray-600">
            <h3 className="text-logoWhite font-semibold mb-4">Pending Escalations</h3>
            {analytics.pending.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analytics.pending.map((escalation) => (
                  <div key={`${escalation.ticketId}-${escalation.level}`} className="border border-red-600 bg-red-900 bg-opacity-20 rounded p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-logoWhite font-medium">{escalation.ticketId}</span>
                      <span className="text-red-400 text-sm">{escalation.level}</span>
                    </div>
                    <div className="text-xs text-darkWhite space-y-1">
                      <div>Customer: {escalation.customer}</div>
                      <div>Assignee: {escalation.assignee}</div>
                      <div className="text-red-400">Overdue: {escalation.overdueDuration} days</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-darkWhite text-sm">No pending escalations</p>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={fetchAnalytics}
            className="bg-logoBlue hover:bg-blue-600 text-logoWhite px-4 py-2 rounded-lg transition-colors"
          >
            Refresh Data
          </button>
        </div>

      </div>
    </div>
  );
}