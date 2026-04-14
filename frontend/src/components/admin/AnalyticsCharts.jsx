import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const AnalyticsCharts = ({ analytics }) => {
  const queryData = [
    { name: 'RAG', value: analytics.ragQueries || 0 },
    { name: 'Action', value: analytics.actionQueries || 0 },
  ];

  const escalationData = [
    { name: 'Escalated', value: analytics.escalations || 0 },
    { name: 'Resolved', value: (analytics.totalQueries - analytics.escalations) || 0 },
  ];

  const COLORS = ['#2563eb', '#cbd5e1'];
  const ESCALATION_COLORS = ['#ef4444', '#22c55e'];

  // Dummy response time trend (Line chart)
  const trendData = [
    { time: '10:00', rt: 450 },
    { time: '11:00', rt: 520 },
    { time: '12:00', rt: 480 },
    { time: '13:00', rt: 610 },
    { time: '14:00', rt: 550 },
    { time: '15:00', rt: 500 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Query Distribution</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={queryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Escalation Rate</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={escalationData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {escalationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ESCALATION_COLORS[index % ESCALATION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-500 font-medium">Escalated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-500 font-medium">Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
