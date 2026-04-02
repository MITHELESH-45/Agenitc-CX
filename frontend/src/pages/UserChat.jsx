import React, { useState } from 'react';
import ChatBox from '../components/ChatBox';
import { sendMessage } from '../services/api';
import { LogOut, LayoutDashboard, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessage(currentInput, 'user_1');
      const botMessage = {
        text: response.data?.reply || "I'm sorry, I couldn't process that.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: "I'm having trouble connecting to the server. Please make sure the backend is running on port 3000.",
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <User className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Agentic-CX</h2>
              <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
                Connected
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Settings, label: 'Settings', active: false },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all cursor-pointer ${
                item.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900">AI Assistant</h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-widest">Active Chat Session</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="md:hidden p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <ChatBox
            messages={messages}
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            isLoading={isLoading}
          />
        </div>

        {/* Footer */}
        <footer className="py-2 px-6 bg-white border-t border-slate-100 text-center shrink-0">
          <p className="text-[10px] text-slate-300 font-medium">
            AI can make mistakes. Please verify important information.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default UserChat;
