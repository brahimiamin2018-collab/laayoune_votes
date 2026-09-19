import React, { useState } from 'react';
import { Lock, User, KeyRound, Vote, AlertCircle, RefreshCw } from 'lucide-react';

export default function LoginModal({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Veuillez saisir votre identifiant et mot de passe.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await res.json();
      if (res.ok && data && data.success && data.session) {
        setLoading(false);
        onLogin(data.session);
      } else {
        setLoading(false);
        setErrorMsg(data?.error || 'Identifiant ou mot de passe incorrect.');
      }
    } catch (err) {
      setLoading(false);
      if (err.name === 'AbortError') {
        setErrorMsg('Délai d\'attente dépassé. Le serveur ne répond pas.');
      } else {
        setErrorMsg('Impossible de contacter le serveur. Vérifiez que le serveur est démarré.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-panel border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden my-auto">
        
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-lg shadow-sky-500/20 mb-2">
            <Vote className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black text-white">
            Connexion au Système Électoral
          </h2>
          <p className="text-xs text-slate-400">
            Circonscription Électorale de Tan-Tan
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              Identifiant / Code Bureau
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder=""
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500 transition min-h-[46px] text-sm"
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              inputMode="text"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              Mot de Passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=""
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500 transition min-h-[46px] text-sm"
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition text-sm mt-3 active:scale-95 min-h-[48px]"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            <span>{loading ? 'Connexion en cours...' : 'Se Connecter'}</span>
          </button>

        </form>

      </div>
    </div>
  );
}
