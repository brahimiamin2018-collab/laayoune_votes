import React, { useState, useEffect } from 'react';
import { BarChart3, Award, Users, CheckCircle2, FileSpreadsheet, RefreshCw, Filter, Vote } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function LiveAggregationDashboard({ onSelectPvForEdit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const url = selectedCommune && selectedCommune !== 'ALL' 
        ? `/api/depouillement/totaux?commune=${encodeURIComponent(selectedCommune)}`
        : '/api/depouillement/totaux';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erreur chargement totaux:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [selectedCommune]);

  const exportToExcel = () => {
    if (!data || !data.results_by_party) return;

    const rows = data.results_by_party.map((p, idx) => ({
      'الترتيب': idx + 1,
      'رمز الحزب': p.code,
      'اسم الحزب بالعربية': p.nom_arabe || '',
      'اسم الحزب بالفرنسية': p.nom_parti,
      'وكيل اللائحة': p.tete_liste || '',
      'مجموع الأصوات': p.total_voix,
      'النسبة المئوية (%)': `${p.pourcentage}%`
    }));

    const summaryRow = {
      'الترتيب': 'المجموع',
      'رمز الحزب': '-',
      'اسم الحزب بالعربية': 'الأصوات المعبر عنها',
      'اسم الحزب بالفرنسية': 'Suffrages Exprimés',
      'وكيل اللائحة': '',
      'مجموع الأصوات': data.total_exprimes,
      'النسبة المئوية (%)': '100%'
    };

    const ws = XLSX.utils.json_to_sheet([...rows, {}, summaryRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نتائج طانطان 2026');
    XLSX.writeFile(wb, `نتائج_الفرز_طانطان_2026_${selectedCommune}.xlsx`);
  };

  const exportCloudBackup = async () => {
    try {
      const res = await fetch('/api/depouillement/export-cloud');
      if (res.ok) {
        const json = await res.json();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `tantan_votes_cloud_backup_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (e) {
      console.error('Erreur export cloud:', e);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
        <p className="text-sm font-medium">جاري تحميل النتائج الإجمالية للأحزاب...</p>
      </div>
    );
  }

  const filteredParties = (data?.results_by_party || []).filter(p => 
    p.nom_parti.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.nom_arabe && p.nom_arabe.includes(searchFilter)) ||
    (p.tete_liste && p.tete_liste.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const topParty = data?.results_by_party?.[0];

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Controls Bar */}
      <div className="glass-panel p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">الجماعة :</span>
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">جميع الجماعات (174 مكتب تصويت)</option>
              <option value="Tan-Tan" className="bg-slate-900 text-white">طانطان (81 مكتب تصويت)</option>
              <option value="El Ouatia" className="bg-slate-900 text-white">الوطية (18 مكتب تصويت)</option>
              <option value="Ben Khlil" className="bg-slate-900 text-white">بن خليل (15 مكتب تصويت)</option>
              <option value="Abteh" className="bg-slate-900 text-white">أبطيح (15 مكتب تصويت)</option>
              <option value="Chbika" className="bg-slate-900 text-white">الشبيكة (15 مكتب تصويت)</option>
              <option value="Tilemzoune" className="bg-slate-900 text-white">تلمزون (15 مكتب تصويت)</option>
              <option value="Msied" className="bg-slate-900 text-white">لمسيد (15 مكتب تصويت)</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسيل</span>
          </button>

          <button
            onClick={exportCloudBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/20"
            title="حفظ نسخة احتياطية من قاعدة البيانات"
          >
            <Vote className="w-4 h-4" />
            <span>نسخة احتياطية</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (2x2 grid on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        <div className="glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-sky-400 font-semibold mb-1 sm:mb-2">
            <span>نسبة الفرز</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {data?.depouilles_count || 0} / {data?.total_bureaux || 0}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            المكاتب المفروزة ({data?.taux_depouillement || 0}%)
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-blue-400 font-semibold mb-1 sm:mb-2">
            <span>عدد المصوتين</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {(data?.total_votants || 0).toLocaleString('ar-MA')}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            المشاركة : <strong className="text-blue-300">{data?.taux_participation || 0}%</strong>
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-emerald-400 font-semibold mb-1 sm:mb-2">
            <span>الأصوات المعبر عنها</span>
            <Vote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400">
            {(data?.total_exprimes || 0).toLocaleString('ar-MA')}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            أصوات صحيحة
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-amber-400 font-semibold mb-1 sm:mb-2">
            <span>الحزب المتصدر</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <div className="text-base sm:text-xl font-black text-amber-300 truncate">
            {topParty ? `${topParty.nom_arabe || topParty.code} (${topParty.total_voix})` : 'لا يوجد'}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            {topParty ? `${topParty.code} - ${topParty.nom_parti}` : 'في انتظار المحاضر'}
          </div>
        </div>

      </div>

      {/* Main Aggregation Table - Optimized for Smartphone with Arabic Party Names */}
      <div className="glass-panel p-3 sm:p-5 rounded-2xl border border-slate-800 space-y-3 sm:space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-sky-400" />
            ترتيب الأحزاب السياسية
          </h3>
          
          <input
            type="text"
            placeholder="بحث عن حزب أو وكيل لائحة..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-slate-900/60">
                <th className="p-2 sm:p-3 w-10 text-center">#</th>
                <th className="p-2 sm:p-3 text-right">الحزب السياسي</th>
                <th className="p-2 sm:p-3 hidden md:table-cell text-right">وكيل اللائحة</th>
                <th className="p-2 sm:p-3 text-left">الأصوات</th>
                <th className="p-2 sm:p-3 text-left">النسبة %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
              {filteredParties.map((p, idx) => {
                const isPi = p.code === 'PI';
                return (
                  <tr key={p.id} className={`transition ${
                    isPi 
                      ? 'bg-gradient-to-r from-sky-950/40 via-blue-950/20 to-slate-900/60 border-r-4 border-r-sky-400 shadow-md' 
                      : 'hover:bg-slate-900/40'
                  }`}>
                    <td className="p-2 sm:p-3 text-center text-slate-400 font-extrabold text-xs sm:text-sm">
                      #{idx + 1}
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-2.5">
                        {isPi ? (
                          <div className="w-6 h-6 p-0.5 bg-gradient-to-br from-sky-500/30 via-slate-900 to-blue-900/60 border border-sky-400/50 rounded-lg flex-shrink-0 flex items-center justify-center shadow-md shadow-sky-500/20 ring-1 ring-sky-400/30">
                            <img src="/pi.png" alt="شعار حزب الاستقلال" className="w-full h-full object-contain filter drop-shadow-sm" />
                          </div>
                        ) : (
                          <div 
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-sm" 
                            style={{ backgroundColor: p.couleur_hex }}
                          ></div>
                        )}
                        <div className="min-w-0">
                          <div className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                            <span className="text-sky-300 font-black">{p.nom_arabe || p.nom_parti}</span>
                            <span className="text-slate-400 font-bold text-[11px]">({p.code})</span>
                            {isPi && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[9px] font-black tracking-wider uppercase shadow-sm">
                                ★ حزب الاستقلال
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px] sm:max-w-[280px]">
                            {p.nom_parti}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 hidden md:table-cell font-medium text-right">
                      <span className={isPi ? "text-sky-200 font-bold" : "text-slate-300"}>
                        {p.tete_liste || 'غير محدد'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3 text-left font-black text-white text-xs sm:text-sm whitespace-nowrap">
                      {p.total_voix.toLocaleString('ar-MA')}
                    </td>
                    <td className={`p-2 sm:p-3 text-left font-bold whitespace-nowrap ${isPi ? 'text-sky-300 font-black text-xs sm:text-sm' : 'text-sky-400 text-xs'}`}>
                      {p.pourcentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
