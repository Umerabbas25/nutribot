import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { ChatPage } from './pages/ChatPage';
import { TrendsPage } from './pages/TrendsPage';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/trends" element={<TrendsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
