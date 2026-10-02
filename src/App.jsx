import React, { useState } from 'react';
import Header from './components/Header';
import LiveAggregationDashboard from './components/LiveAggregationDashboard';
import PvEntryGrid from './components/PvEntryGrid';
import BureauxManager from './components/BureauxManager';
import PartisManager from './components/PartisManager';
import UsersManager from './components/UsersManager';
import LoginModal from './components/LoginModal';
import { ShieldCheck } from 'lucide-react';

export default function App() {
  const hostname = window.location.hostname;
  const isLocal = 
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname.startsWith('192.168.') || 
    hostname.startsWith('10.') || 
    hostname.endsWith('.local');

  if (!isLocal) {
    document.title = "404: NOT_FOUND";
    const favicons = document.querySelectorAll("link[rel*='icon']");
    favicons.forEach(el => el.setAttribute("href", "data:image/x-icon;,"));

    return (
      <div className="fixed inset-0 bg-white text-black font-sans flex flex-col items-center justify-center p-6 text-center z-[999999]">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-semibold text-black mb-2 tracking-tight">
            This page doesn’t exist
          </h1>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            It may have been moved, removed, or never existed.
          </p>
          <div className="border-t border-gray-200 pt-6 text-xs text-gray-400 font-mono">
            <div className="font-bold text-gray-700 mb-1">
              404 DEPLOYMENT_NOT_FOUND
            </div>
            <div>cdg1::6cl2r-1790963931287-0d797d55c6dc</div>
          </div>
        </div>
      </div>
    );
  }

  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('tantan_votes_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('totaux');

  const handleLoginSuccess = (newSession) => {
    setSession(newSession);
    localStorage.setItem('tantan_votes_session', JSON.stringify(newSession));
    if (newSession.role === 'responsable') {
      setActiveTab('pv');
    } else {
      setActiveTab('totaux');
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('tantan_votes_session');
  };

  // IF NOT LOGGED IN: Lock App with Login Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center relative overflow-hidden">
        {/* Background glow & accents matching PI emblem */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sky-500/15 blur-[130px] rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-blue-600/15 blur-[140px] rounded-full" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
        </div>
        <LoginModal onLogin={handleLoginSuccess} />
      </div>
    );
  }

  const isAdmin = session.role === 'admin';
  const isResponsable = session.role === 'responsable';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      
      {/* Ambient Background matching PI Symbol */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top central sky-blue ambient aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-sky-500/20 via-blue-600/10 to-transparent blur-[130px] rounded-full" />
        {/* Side subtle glowing Orbs */}
        <div className="absolute top-1/3 -right-32 w-[450px] h-[450px] bg-sky-400/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-10 -left-32 w-[450px] h-[450px] bg-blue-700/10 blur-[150px] rounded-full" />
        {/* Grid texture overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        {/* Subtle Watermark PI Emblem Logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.025] flex items-center justify-center select-none pointer-events-none">
          <img src="/pi.png" alt="" className="w-full h-full object-contain filter grayscale" />
        </div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header Bar */}
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          session={session} 
          onLogout={handleLogout}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
          
          {/* RESTRICTED RESPONSABLE VIEW: ONLY PV ENTRY FOR THEIR ASSIGNED BUREAU */}
          {isResponsable && (
            <PvEntryGrid assignedBureauId={session.bureau_id} session={session} />
          )}

          {/* ADMIN VIEWS */}
          {isAdmin && activeTab === 'totaux' && (
            <LiveAggregationDashboard onSelectPvForEdit={() => setActiveTab('pv')} />
          )}

          {isAdmin && activeTab === 'pv' && (
            <PvEntryGrid session={session} />
          )}

          {isAdmin && activeTab === 'bureaux' && (
            <BureauxManager />
          )}

          {isAdmin && activeTab === 'partis' && (
            <PartisManager />
          )}

          {isAdmin && activeTab === 'users' && (
            <UsersManager />
          )}

        </main>

        <footer className="glass-panel border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          <p>Application Autonome d'Assemblage des Votes Tan-Tan • Connecté : {session.username}</p>
        </footer>
      </div>

    </div>
  );
}
