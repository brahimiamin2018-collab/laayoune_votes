import React from 'react';
import { BarChart3, FileText, Building2, Award, Users, LogOut } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, session, onLogout }) {
  const isAdmin = session?.role === 'admin';

  const tabs = [
    { id: 'totaux', label: 'النتائج', fullLabel: 'النتائج الإجمالية', icon: BarChart3, adminOnly: true },
    { id: 'pv', label: 'المحاضر', fullLabel: 'إدخال المحاضر', icon: FileText, adminOnly: true },
    { id: 'bureaux', label: 'المكاتب', fullLabel: 'مكاتب التصويت', icon: Building2, adminOnly: true },
    { id: 'partis', label: 'الأحزاب', fullLabel: 'الأحزاب السياسية', icon: Award, adminOnly: true },
    { id: 'users', label: 'الحسابات', fullLabel: 'حسابات المسؤولين', icon: Users, adminOnly: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 shadow-2xl backdrop-blur-xl bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-24">
            
            {/* Brand Logo - Enriched & Enlarged with Styled Background */}
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-sky-500/25 via-slate-900 to-blue-950/80 border border-sky-400/40 rounded-2xl shadow-xl shadow-sky-500/20 ring-1 ring-white/10 hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                <img src="/pi.png" alt="شعار حزب الاستقلال" className="w-10 h-10 sm:w-14 sm:h-14 object-contain filter drop-shadow-md" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-black text-white tracking-wide">حزب الاستقلال</div>
                <div className="text-[11px] text-sky-400 font-bold uppercase tracking-wider">Parti de l'Istiqlal</div>
              </div>
            </div>

            {/* Desktop Navigation Bar */}
            {isAdmin && (
              <nav className="hidden md:flex items-center space-x-1 sm:space-x-2 space-x-reverse">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center space-x-2 space-x-reverse px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
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
                className="flex items-center space-x-1.5 space-x-reverse px-3 py-2 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/40 text-xs font-semibold text-rose-300 transition active:scale-95 shadow-md shadow-rose-950/20"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">تسجيل الخروج</span>
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
