import React from 'react';
import { BarChart3, FileText, Building2, Award, Users, LogOut, Vote } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, session, onLogout }) {
  const isAdmin = session?.role === 'admin';
  const bd = session?.bureau_details;

  const tabs = [
    { id: 'totaux', label: 'Totaux', fullLabel: 'Tableau des Totaux', icon: BarChart3, adminOnly: true },
    { id: 'pv', label: 'PV', fullLabel: 'Saisie d\'un PV', icon: FileText, adminOnly: true },
    { id: 'bureaux', label: 'Bureaux', fullLabel: 'Bureaux de Vote', icon: Building2, adminOnly: true },
    { id: 'partis', label: 'Partis', fullLabel: 'Partis Politiques', icon: Award, adminOnly: true },
    { id: 'users', label: 'Comptes', fullLabel: 'Comptes Responsables', icon: Users, adminOnly: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            
            {/* Brand Logo */}
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 sm:p-2 bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl shadow-lg">
                <img src="/favicon.png" alt="Logo PI" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
              </div>
            </div>

            {/* Desktop Navigation Bar */}
            {isAdmin && (
              <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-xl font-bold text-xs transition-all ${
                        isActive
                          ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 border border-sky-400/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{t.fullLabel}</span>
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/40 text-xs font-semibold text-rose-300 transition active:scale-95"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Smartphone Bottom Navigation Bar (Admin ONLY) */}
      {isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-slate-800 bg-slate-950/95 backdrop-blur-xl px-2 py-1.5 pb-safe">
          <div className="grid grid-cols-5 gap-1 text-center">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all ${
                    isActive
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 active:scale-95'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span className="text-[10px] truncate max-w-full">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
