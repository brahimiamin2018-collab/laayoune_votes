import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, Filter, X, Upload, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function BureauxManager() {
  const [bureaux, setBureaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingBureau, setEditingBureau] = useState(null);

  const [codeBureau, setCodeBureau] = useState('');
  const [commune, setCommune] = useState('Tan-Tan');
  const [centreVote, setCentreVote] = useState('');
  const [numeroBureau, setNumeroBureau] = useState('1');
  const [adresse, setAdresse] = useState('');
  const [nombreInscrits, setNombreInscrits] = useState('450');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadBureaux();
  }, [selectedCommune]);

  const loadBureaux = async () => {
    setLoading(true);
    try {
      const url = selectedCommune && selectedCommune !== 'ALL'
        ? `/api/depouillement/bureaux?commune=${encodeURIComponent(selectedCommune)}`
        : '/api/depouillement/bureaux';
      const res = await fetch(url);
      if (res.ok) setBureaux(await res.json());
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBureau(null);
    setCodeBureau(`BV-TAN-${(bureaux.length + 1).toString().padStart(3, '0')}`);
    setCommune('Tan-Tan');
    setCentreVote('');
    setNumeroBureau((bureaux.length + 1).toString());
    setAdresse('');
    setNombreInscrits('450');
    setShowModal(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBureau(b);
    setCodeBureau(b.code_bureau);
    setCommune(b.commune);
    setCentreVote(b.centre_vote);
    setNumeroBureau(b.numero_bureau.toString());
    setAdresse(b.adresse || '');
    setNombreInscrits(b.nombre_inscrits.toString());
    setShowModal(true);
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`حذف مكتب التصويت "${code}" ؟`)) return;
    try {
      const res = await fetch(`/api/depouillement/bureaux/${id}`, { method: 'DELETE' });
      if (res.ok) loadBureaux();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      code_bureau: codeBureau,
      commune,
      centre_vote: centreVote,
      numero_bureau: parseInt(numeroBureau) || 1,
      adresse,
      nombre_inscrits: parseInt(nombreInscrits) || 0
    };

    try {
      const url = editingBureau ? `/api/depouillement/bureaux/${editingBureau.id}` : '/api/depouillement/bureaux';
      const method = editingBureau ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        loadBureaux();
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcelFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const dataStr = evt.target.result;
        const workbook = XLSX.read(dataStr, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

        let addedCount = 0;
        for (const r of rows) {
          const code = r['Code Bureau'] || r['CODE_BUREAU'] || r['Code'] || `BV-IMP-${Math.floor(Math.random()*10000)}`;
          const com = r['Commune'] || r['COMMUNE'] || 'Tan-Tan';
          const centre = r['Centre de Vote'] || r['CENTRE_VOTE'] || r['Centre'] || 'Centre de Vote';
          const num = r['Numéro Bureau'] || r['NUMERO_BUREAU'] || r['Num'] || 1;
          const inscrits = r['Nombre Inscrits'] || r['NOMBRE_INSCRITS'] || r['Inscrits'] || 450;

          await fetch('/api/depouillement/bureaux', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code_bureau: code,
              commune: com,
              centre_vote: centre,
              numero_bureau: num,
              nombre_inscrits: inscrits
            })
          });
          addedCount++;
        }

        alert(`تم استيراد ${addedCount} مكتب تصويت بنجاح!`);
        loadBureaux();
      } catch (err) {
        alert('خطأ في استيراد ملف إكسيل: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredBureaux = bureaux.filter(b =>
    b.code_bureau.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.centre_vote.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.commune.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.numero_bureau.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6" dir="rtl">
      
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            مكاتب التصويت - إقليم طانطان ({bureaux.length})
          </h2>
          <p className="text-xs text-slate-400">
            إدارة المكاتب والمراكز وعدد المسجلين في كل مكتب تصويت.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">الجماعة :</span>
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">جميع الجماعات (176 مكتب تصويت)</option>
              <option value="Tan-Tan" className="bg-slate-900 text-white">طانطان (82 مكتب تصويت)</option>
              <option value="El Ouatia" className="bg-slate-900 text-white">الوطية (19 مكتب تصويت)</option>
              <option value="Ben Khlil" className="bg-slate-900 text-white">بن خليل (15 مكتب تصويت)</option>
              <option value="Abteh" className="bg-slate-900 text-white">أبطيح (15 مكتب تصويت)</option>
              <option value="Chbika" className="bg-slate-900 text-white">الشبيكة (15 مكتب تصويت)</option>
              <option value="Tilemzoune" className="bg-slate-900 text-white">تلمزون (15 مكتب تصويت)</option>
              <option value="Msied" className="bg-slate-900 text-white">لمسيد (15 مكتب تصويت)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>استيراد إكسيل</span>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleExcelFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-sky-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مكتب تصويت</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center gap-3 bg-slate-900/60">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="البحث برقم المكتب، اسم المركز..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none text-right"
        />
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4">رمز المكتب</th>
                <th className="py-3 px-4">رقم المكتب</th>
                <th className="py-3 px-4">الجماعة</th>
                <th className="py-3 px-4">مركز التصويت</th>
                <th className="py-3 px-4 text-center">حالة الفرز</th>
                <th className="py-3 px-4 text-left">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredBureaux.length > 0 ? (
                filteredBureaux.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-sky-400">{b.code_bureau}</td>
                    <td className="py-3 px-4 font-extrabold text-white">مكتب رقم {b.numero_bureau}</td>
                    <td className="py-3 px-4 text-slate-300">{b.commune}</td>
                    <td className="py-3 px-4 text-slate-200 font-medium">{b.centre_vote}</td>
                    <td className="py-3 px-4 text-center">
                      {b.has_pv ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.pv?.est_valide 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>تم فرزه ({b.pv?.suffrages_exprimes} صوت)</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] italic">لم يفرز بعد</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-left">
                      <div className="flex items-center justify-start gap-1">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-sky-400 rounded-lg"
                          title="تعديل"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b.id, b.code_bureau)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500 italic">
                    لم يتم العثور على أي مكتب تصويت.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingBureau ? 'تعديل مكتب التصويت' : 'إضافة مكتب تصويت جديد'}
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
                  <label className="text-slate-400 font-medium">رمز المكتب</label>
                  <input
                    type="text"
                    value={codeBureau}
                    onChange={(e) => setCodeBureau(e.target.value)}
                    placeholder="BV-TAN-001"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-sky-500 text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">رقم المكتب</label>
                  <input
                    type="number"
                    min="1"
                    value={numeroBureau}
                    onChange={(e) => setNumeroBureau(e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-sky-500 text-right"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">الجماعة</label>
                <select
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500"
                >
                  <option value="Tan-Tan">طانطان</option>
                  <option value="El Ouatia">الوطية</option>
                  <option value="Abteh">أبطيح</option>
                  <option value="Ben Khlil">بن خليل</option>
                  <option value="Chbika">الشبيكة</option>
                  <option value="Msied">لمسيد</option>
                  <option value="Tilemzoune">تلمزون</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">مركز التصويت</label>
                <input
                  type="text"
                  value={centreVote}
                  onChange={(e) => setCentreVote(e.target.value)}
                  placeholder="مثال: مدرسة المسيرة"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:outline-none focus:border-sky-500 text-right"
                  required
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
