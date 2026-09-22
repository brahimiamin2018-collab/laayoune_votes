import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Award, X, Palette } from 'lucide-react';
import PartySymbol from './PartySymbol';

export default function PartisManager() {
  const [partis, setPartis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingParti, setEditingParti] = useState(null);

  const [code, setCode] = useState('');
  const [nomParti, setNomParti] = useState('');
  const [nomArabe, setNomArabe] = useState('');
  const [sigleArabe, setSigleArabe] = useState('');
  const [couleurHex, setCouleurHex] = useState('#0066B3');
  const [teteListe, setTeteListe] = useState('');
  const [ordreAffichage, setOrdreAffichage] = useState('0');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPartis();
  }, []);

  const loadPartis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/depouillement/partis');
      if (res.ok) setPartis(await res.json());
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingParti(null);
    setCode('');
    setNomParti('');
    setNomArabe('');
    setSigleArabe('');
    setCouleurHex('#0066B3');
    setTeteListe('');
    setOrdreAffichage((partis.length + 1).toString());
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingParti(p);
    setCode(p.code);
    setNomParti(p.nom_parti);
    setNomArabe(p.nom_arabe || '');
    setSigleArabe(p.sigle_arabe || '');
    setCouleurHex(p.couleur_hex || '#0066B3');
    setTeteListe(p.tete_liste || '');
    setOrdreAffichage((p.ordre_affichage || 0).toString());
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`حذف الحزب السياسي "${name}" ؟`)) return;
    try {
      const res = await fetch(`/api/depouillement/partis/${id}`, { method: 'DELETE' });
      if (res.ok) loadPartis();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      code,
      nom_parti: nomParti,
      nom_arabe: nomArabe,
      sigle_arabe: sigleArabe,
      couleur_hex: couleurHex,
      tete_liste: teteListe,
      logo_icon: 'Vote',
      ordre_affichage: parseInt(ordreAffichage) || 0
    };

    try {
      const url = editingParti ? `/api/depouillement/partis/${editingParti.id}` : '/api/depouillement/partis';
      const method = editingParti ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        loadPartis();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert('حدث خطأ أثناء حفظ بيانات الحزب: ' + (errJson.error || 'خطأ في الخادم'));
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('تعذر الاتصال بالخادم أثناء حفظ التغييرات.');
    } finally {
      setSubmitting(false);
    }
  };

  const defaultColors = [
    '#0066B3', '#008080', '#1E3A8A', '#DC2626', '#16A34A', 
    '#0D9488', '#EA580C', '#15803D', '#B91C1C', '#854D0E',
    '#9333EA', '#4F46E5', '#2563EB', '#059669', '#D97706'
  ];

  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-400" />
            الأحزاب السياسية المشاركة ({partis.length})
          </h2>
          <p className="text-xs text-slate-400">
            إدارة قائمة الأحزاب السياسية وألوانها الرسمية ووكلاء اللوائح.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة حزب سياسي</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partis.map((p) => (
          <div 
            key={p.id}
            className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 relative group hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <PartySymbol code={p.code} couleurHex={p.couleur_hex} logoIcon={p.logo_icon} size="md" />
                <div>
                  <div className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{p.nom_arabe || p.nom_parti}</span>
                    <span className="text-sky-300 text-xs font-normal">({p.code})</span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium">
                    {p.nom_parti}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg"
                  title="تعديل"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.code)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1">
              <div className="text-slate-400 flex items-center justify-between">
                <span>وكيل اللائحة :</span>
                <span className="font-bold text-slate-200">{p.tete_liste || 'غير محدد'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingParti ? 'تعديل الحزب السياسي' : 'إضافة حزب سياسي جديد'}
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
                  <label className="text-slate-400 font-medium">رمز الحزب (ex: PI, RNI)</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="PI"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-sky-500 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">اختصار بالعربية (مثال: أحرار)</label>
                  <input
                    type="text"
                    value={sigleArabe}
                    onChange={(e) => setSigleArabe(e.target.value)}
                    placeholder="استقلال"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-sky-500 text-right"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">اسم الحزب بالعربية</label>
                <input
                  type="text"
                  value={nomArabe}
                  onChange={(e) => setNomArabe(e.target.value)}
                  placeholder="حزب الاستقلال"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold text-right focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">اسم الحزب بالفرنسية</label>
                <input
                  type="text"
                  value={nomParti}
                  onChange={(e) => setNomParti(e.target.value)}
                  placeholder="Parti de l'Istiqlal"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">وكيل اللائحة</label>
                <input
                  type="text"
                  value={teteListe}
                  onChange={(e) => setTeteListe(e.target.value)}
                  placeholder="اسم مرشح وكيل اللائحة"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-right focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  اللون الرسمي :
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={couleurHex}
                    onChange={(e) => setCouleurHex(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-800 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={couleurHex}
                    onChange={(e) => setCouleurHex(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs w-28 uppercase"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {defaultColors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCouleurHex(c)}
                      className="w-6 h-6 rounded-full border border-slate-700 shadow-sm hover:scale-110 transition"
                      style={{ backgroundColor: c }}
                    ></button>
                  ))}
                </div>
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
