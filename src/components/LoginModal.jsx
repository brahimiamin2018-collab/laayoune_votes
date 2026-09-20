import React, { useState } from 'react';
import { Lock, User, KeyRound, AlertCircle, RefreshCw } from 'lucide-react';

export default function LoginModal({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('المرجو إدخال اسم المستخدم وكلمة المرور.');
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
        setErrorMsg(data?.error || 'اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    } catch (err) {
      setLoading(false);
      if (err.name === 'AbortError') {
        setErrorMsg('انتهت مهلة الانتظار. الخادم لا يستجيب.');
      } else {
        setErrorMsg('تعذر الاتصال بالخادم. تحقق من تشغيل الخادم.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="glass-panel border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden my-auto">
        
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header with Enlarged Logo & Gradient Background Container */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-sky-500/25 via-slate-900 to-blue-950/90 border border-sky-400/40 rounded-3xl shadow-2xl shadow-sky-500/25 mb-1 ring-1 ring-white/15 hover:scale-105 transition-transform duration-300">
            <img src="/pi.png" alt="شعار حزب الاستقلال" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            تسجيل الدخول - نظام الفرز
          </h2>
          <div className="text-xs text-sky-400 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <span>★ حزب الاستقلال</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300">الدائرة الانتخابية طانطان</span>
          </div>
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
              اسم المستخدم / رمز المكتب
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم المستخدم"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500 transition min-h-[46px] text-sm text-right"
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
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500 transition min-h-[46px] text-sm text-right"
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
            <span>{loading ? 'جاري الاتصال...' : 'دخول'}</span>
          </button>

        </form>

      </div>
    </div>
  );
}
