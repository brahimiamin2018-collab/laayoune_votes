import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, KeyRound, RefreshCw, Printer, Search, Building2, Shield, X, CheckCircle2 } from 'lucide-react';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [bureaux, setBureaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('responsable');
  const [bureauId, setBureauId] = useState('');
  const [nomResponsable, setNomResponsable] = useState('');
  const [tel, setTel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resU, resB] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/depouillement/bureaux')
      ]);

      if (resU.ok) setUsers(await resU.json());
      if (resB.ok) setBureaux(await resB.json());
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!window.confirm('هل تريد توليد حسابات تلقائياً لجميع مكاتب التصويت غير المسندة؟')) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/users/generate-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(`تم توليد ${data.createdCount} حساب مسند بنجاح!`);
        loadData();
      }
    } catch (err) {
      console.error('Erreur génération:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('pass2026');
    setRole('responsable');
    setBureauId('');
    setNomResponsable('');
    setTel('');
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(u.password || '');
    setRole(u.role);
    setBureauId(u.bureau_id ? u.bureau_id.toString() : '');
    setNomResponsable(u.nom_responsable || '');
    setTel(u.tel || '');
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`حذف الحساب "${name}" ؟`)) return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      username,
      password,
      role,
      bureau_id: bureauId ? parseInt(bureauId) : null,
      nom_responsable: nomResponsable,
      tel
    };

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        loadData();
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintSheets = () => {
    window.print();
  };

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.nom_responsable && u.nom_responsable.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.code_bureau && u.code_bureau.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.centre_vote && u.centre_vote.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 print:p-0" dir="rtl">
      
      {/* Header */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            حسابات المسؤولين عن المكاتب ({users.length})
          </h2>
          <p className="text-xs text-slate-400">
            تعيين وإدارة بيانات الدخول الخاصة بكل مسؤول مكتب تصويت.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>توليد الحسابات الناقصة</span>
          </button>

          <button
            onClick={handlePrintSheets}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>طباعة بطاقات الدخول</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء حساب جديد</span>
          </button>

        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center gap-3 bg-slate-900/60 print:hidden">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="البحث باسم المستخدم، اسم المسؤول، المكتب أو المركز..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none text-right"
        />
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl print:border-none print:shadow-none print:bg-white print:text-black">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black">
                <th className="py-3 px-4">اسم المستخدم</th>
                <th className="py-3 px-4">كلمة المرور</th>
                <th className="py-3 px-4">الصفة</th>
                <th className="py-3 px-4">المكتب المسند</th>
                <th className="py-3 px-4">اسم المسؤول</th>
                <th className="py-3 px-4 text-left print:hidden">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs print:divide-gray-300">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    
                    <td className="py-3 px-4 font-bold text-sky-400 print:text-black">
                      {u.username}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-200 print:text-black">
                      {u.password}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {u.role === 'admin' ? 'مدير النظام' : 'مسؤول مكتب'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300 print:text-black font-semibold">
                      {u.bureau_id ? (
                        <div>
                          <div className="text-white font-bold">{u.centre_vote}</div>
                          <div className="text-[11px] text-slate-400">مكتب رقم {u.numero_bureau} ({u.code_bureau}) • {u.commune}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">جميع المكاتب (مدير)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-200 print:text-black">
                      {u.nom_responsable || '-'}
                    </td>

                    <td className="py-3 px-4 text-left print:hidden">
                      <div className="flex items-center justify-start gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u.id, u.username)}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 italic">
                    لم يتم العثور على أي حساب.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingUser ? 'تعديل الحساب' : 'إنشاء حساب مسؤول جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">اسم المستخدم</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="bv_tan_001"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-sky-500 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">كلمة المرور</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-sky-500 text-right"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">الصفة / الصلاحية</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="responsable">مسؤول مكتب تصويت (محدد)</option>
                  <option value="admin">مدير النظام (وصول كامل)</option>
                </select>
              </div>

              {role === 'responsable' && (
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">مكتب التصويت المسند</label>
                  <select
                    value={bureauId}
                    onChange={(e) => setBureauId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500"
                    required
                  >
                    <option value="">-- اختر مكتب تصويت --</option>
                    {bureaux.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.code_bureau} - {b.centre_vote} (مكتب رقم {b.numero_bureau}) • {b.commune}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">اسم المسؤول (اختياري)</label>
                <input
                  type="text"
                  value={nomResponsable}
                  onChange={(e) => setNomResponsable(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-sky-500 text-right"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20"
                >
                  {submitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
