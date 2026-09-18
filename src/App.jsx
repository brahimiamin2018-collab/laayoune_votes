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
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('laayoune_votes_session');
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
    localStorage.setItem('laayoune_votes_session', JSON.stringify(newSession));
    if (newSession.role === 'responsable') {
      setActiveTab('pv');
    } else {
      setActiveTab('totaux');
    }
  };

  const handleLogout = () => {
    setSession(null);
    localStorage.removeItem('laayoune_votes_session');
  };

  // IF NOT LOGGED IN: Lock App with Login Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <LoginModal onLogin={handleLoginSuccess} />
      </div>
    );
  }

  const isAdmin = session.role === 'admin';
  const isResponsable = session.role === 'responsable';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* Header Bar */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        session={session} 
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        
        {/* Banner for Admin ONLY */}
        {isAdmin && (
          <div className="glass-panel p-4 mb-6 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs text-sky-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                Élections Législatives & Communales (23 Septembre 2026)
              </div>
              <div className="text-base sm:text-lg font-black text-white">
                Circonscription Électorale de Laâyoune
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-400">
              <div>Session Administrateur : <strong className="text-white">{session.username}</strong></div>
            </div>
          </div>
        )}

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
        <p>Application Autonome d'Assemblage des Votes Laâyoune • Connecté : {session.username}</p>
      </footer>

    </div>
  );
}
