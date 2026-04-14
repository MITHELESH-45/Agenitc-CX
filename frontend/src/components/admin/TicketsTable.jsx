import React from 'react';

const TicketsTable = ({ tickets }) => {
  const getSentimentStyle = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'angry': return 'bg-red-50 text-red-600 border-red-100';
      case 'frustrated': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'neutral': return 'bg-slate-50 text-slate-600 border-slate-100';
      default: return 'bg-blue-50 text-blue-600 border-blue-100';
    }
  };

  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + '...' : str;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2">
      <div className="p-6 border-b border-slate-50">
        <h3 className="text-lg font-bold text-slate-800">Recent Tickets & Escalations</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-widest uppercase">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4">Sentiment</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((ticket, idx) => (
                <tr key={ticket._id || idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">{ticket.user || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-500" title={ticket.message}>
                      {truncate(ticket.message, 50)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${getSentimentStyle(ticket.sentiment)}`}>
                      {ticket.sentiment || 'neutral'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${ticket.status === 'open' ? 'text-blue-600' : 'text-slate-400'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'open' ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`}></div>
                      {ticket.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketsTable;
