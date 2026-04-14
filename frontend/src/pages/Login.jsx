import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Zap } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();

  const handleUserLogin = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Decorative BG */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 translate-x-1/3 translate-y-1/3"></div>

      <div className="max-w-md w-full z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200 mb-6">
            <Zap className="w-8 h-8 text-white fill-current" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Agentic-CX</h1>
          <p className="text-slate-500 font-medium">Select your portal to get started</p>
        </div>

        {/* Role Selection Cards */}
        <div className="space-y-4">
          {/* User Card */}
          <button
            onClick={handleUserLogin}
            className="group w-full flex items-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 hover:-translate-y-1 cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors mr-6 shrink-0">
              <User className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">User Portal</h3>
              <p className="text-sm text-slate-500">Access the AI assistant and chat tools</p>
            </div>
          </button>

          {/* Admin Card (Enabled) */}
          <button
            onClick={() => navigate('/admin')}
            className="group w-full flex items-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all duration-300 hover:-translate-y-1 cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors mr-6 shrink-0">
              <ShieldCheck className="w-6 h-6 text-indigo-600 group-hover:text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Admin Portal</h3>
              <p className="text-sm text-slate-500">System analytics and evaluation tools</p>
            </div>
            <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-full uppercase tracking-wider ml-2 shrink-0 border border-green-100">
              Active
            </span>
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Powered by Agentic AI Engine</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
