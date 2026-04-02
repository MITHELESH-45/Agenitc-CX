import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import UserChat from './pages/UserChat';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary-100 selection:text-primary-900">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/chat" element={<UserChat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
