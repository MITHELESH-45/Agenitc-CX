import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Database, 
  Activity, 
  AlertCircle, 
  RefreshCw,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics, getMetrics, getTickets } from '../services/api';

import StatCard from '../components/admin/StatCard';
import AnalyticsCharts from '../components/admin/AnalyticsCharts';
import MetricsPanel from '../components/admin/MetricsPanel';
import TicketsTable from '../components/admin/TicketsTable';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    analytics: null,
    metrics: null,
    tickets: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setData(prev => ({ ...prev, loading: true }));
    try {
      const [analytics, metrics, ticketsResult] = await Promise.all([
        getAnalytics(),
        getMetrics(),
        getTickets()
      ]);

      setData({
        analytics,
        metrics,
        tickets: ticketsResult.tickets || [],
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error('Fetch error:', err);
      setData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Failed to fetch dashboard data. Please check backend connection.' 
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (data.loading && !data.analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-bold animate-pulse">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity size={16} className="text-white fill-current" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Agentic-CX <span className="text-blue-600">Admin</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                <span className="text-xs font-bold text-slate-600">Live</span>
              </div>
            </div>
            <button 
              onClick={() => fetchData()}
              disabled={data.loading}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={data.loading ? 'animate-spin' : ''} />
              Manual Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 pt-8">
        {data.error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <span className="text-sm font-bold">{data.error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Queries" 
            value={data.analytics?.totalQueries || 0} 
            icon={Activity} 
            trend="+12%" 
          />
          <StatCard 
            title="RAG Queries" 
            value={data.analytics?.ragQueries || 0} 
            icon={Database} 
          />
          <StatCard 
            title="Action Queries" 
            value={data.analytics?.actionQueries || 0} 
            icon={Users} 
          />
          <StatCard 
            title="Escalations" 
            value={data.analytics?.escalations || 0} 
            icon={AlertCircle} 
            trend={data.analytics?.escalations > 0 ? '+1' : '0'}
          />
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <AnalyticsCharts analytics={data.analytics || {}} />
            <TicketsTable tickets={data.tickets} />
          </div>
          
          <div className="space-y-10">
            <MetricsPanel metrics={data.metrics || {}} />
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-2xl text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700"></div>
              <h3 className="text-lg font-bold mb-2">Automated Optimization</h3>
              <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                Ragas pipeline is monitoring 100% of RAG interactions for quality and faithfulness.
              </p>
              <button className="bg-white text-blue-600 px-6 py-2 rounded-xl text-sm font-extrabold hover:bg-blue-50 transition-colors">
                Run Evaluation
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400">
              <Clock size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Last synced: {data.lastUpdated?.toLocaleTimeString() || 'Never'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
