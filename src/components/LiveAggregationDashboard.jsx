import React, { useState, useEffect } from 'react';
import { BarChart3, Award, Users, CheckCircle2, FileSpreadsheet, RefreshCw, Filter, Vote } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import PartySymbol from './PartySymbol';

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
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border-2 border-slate-700 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-3">
          <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border-2 border-slate-700 text-xs sm:text-sm">
            <Filter className="w-4 h-4 text-sky-400" />
            <span className="text-slate-200 font-bold">الجماعة :</span>
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="bg-transparent text-white font-extrabold focus:outline-none cursor-pointer text-xs sm:text-sm"
            >
              <option value="ALL" className="bg-slate-900 text-white">جميع الجماعات (175 مكتب تصويت)</option>
              <option value="Tan-Tan" className="bg-slate-900 text-white">طانطان (82 مكتب تصويت)</option>
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
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-extrabold transition shadow-lg shadow-emerald-600/30 border border-emerald-400/40"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسيل</span>
          </button>

          <button
            onClick={exportCloudBackup}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-extrabold transition shadow-lg shadow-sky-600/30 border border-sky-400/40"
            title="حفظ نسخة احتياطية من قاعدة البيانات"
          >
            <Vote className="w-4 h-4" />
            <span>نسخة احتياطية</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (2x2 grid on mobile) - Optimized for DataShow Projection */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        <div className="glass-panel p-4 sm:p-5 rounded-2xl border-2 border-sky-400/40 bg-slate-900/90 shadow-2xl">
          <div className="flex items-center justify-between text-xs sm:text-sm text-sky-300 font-extrabold mb-2">
            <span>نسبة الفرز</span>
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
          </div>
          <div className="text-xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {data?.depouilles_count || 0} / {data?.total_bureaux || 0}
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
            المكاتب المفروزة ({data?.taux_depouillement || 0}%)
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border-2 border-blue-400/40 bg-slate-900/90 shadow-2xl">
          <div className="flex items-center justify-between text-xs sm:text-sm text-blue-300 font-extrabold mb-2">
            <span>عدد المصوتين</span>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {(data?.total_votants || 0).toLocaleString('ar-MA')}
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1 truncate">
            مجموع أوراق المصوتين
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border-2 border-emerald-400/40 bg-slate-900/90 shadow-2xl">
          <div className="flex items-center justify-between text-xs sm:text-sm text-emerald-300 font-extrabold mb-2">
            <span>الأصوات المعبر عنها</span>
            <Vote className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-3xl lg:text-4xl font-black text-emerald-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {(data?.total_exprimes || 0).toLocaleString('ar-MA')}
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
            أصوات صحيحة
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-5 rounded-2xl border-2 border-amber-400/40 bg-slate-900/90 shadow-2xl">
          <div className="flex items-center justify-between text-xs sm:text-sm text-amber-300 font-extrabold mb-2">
            <span>الحزب المتصدر</span>
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          </div>
          <div className="flex items-center gap-3">
            {topParty && <PartySymbol code={topParty.code} couleurHex={topParty.couleur_hex} logoIcon={topParty.logo_icon} size="lg" />}
            <div className="min-w-0 flex-1">
              <div className="text-lg sm:text-2xl lg:text-3xl font-black text-amber-300 truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {topParty ? (topParty.nom_arabe || topParty.code) : 'لا يوجد'}
              </div>
              <div className="text-xs sm:text-sm font-black text-amber-200 mt-0.5 truncate">
                {topParty ? `${(topParty.total_voix || 0).toLocaleString('ar-MA')} صوت` : 'في انتظار المحاضر'}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Aggregation Table - High Contrast DataShow Presentation */}
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border-2 border-slate-700 space-y-4 shadow-2xl bg-slate-900">
        
        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-slate-700 text-white font-black uppercase text-xs sm:text-sm tracking-wider bg-slate-950">
                <th className="p-3 sm:p-4 w-12 text-center">#</th>
                <th className="p-3 sm:p-4 text-right">الحزب السياسي</th>
                <th className="p-3 sm:p-4 text-right">وكيل اللائحة</th>
                <th className="p-3 sm:p-4 text-left">الأصوات</th>
                <th className="p-3 sm:p-4 text-left">النسبة %</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800 font-bold text-white relative">
              <AnimatePresence mode="popLayout">
                {filteredParties.map((p, idx) => {
                  const isPi = p.code === 'PI';
                  return (
                    <motion.tr 
                      key={p.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{
                        layout: { type: "spring", stiffness: 35, damping: 16, mass: 1.2 },
                        opacity: { duration: 0.8 }
                      }}
                      className={`transition-colors duration-500 ${
                        isPi 
                          ? 'bg-gradient-to-r from-sky-950/90 via-blue-900/50 to-slate-900 border-r-8 border-r-sky-400 shadow-2xl ring-2 ring-sky-400/50' 
                          : 'hover:bg-slate-800/80 bg-slate-900/60'
                      }`}
                    >
                      <td className="p-3 sm:p-4 text-center text-slate-200 font-black text-sm sm:text-base">
                        #{idx + 1}
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <PartySymbol code={p.code} couleurHex={p.couleur_hex} logoIcon={p.logo_icon} size="md" />
                          <div className="min-w-0">
                            <div className="font-black text-white text-sm sm:text-base md:text-lg flex items-center gap-2 flex-wrap">
                              <span className="text-sky-300 font-black drop-shadow-sm">{p.nom_arabe || p.nom_parti}</span>
                              <span className="text-slate-300 font-extrabold text-xs sm:text-sm">({p.code})</span>
                              {isPi && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400 text-xs font-black tracking-wider uppercase shadow-md">
                                  ★ حزب الاستقلال
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-300 font-semibold truncate max-w-[180px] sm:max-w-[320px]">
                              {p.nom_parti}
                            </div>
                            {p.tete_liste && (
                              <div className="text-xs text-amber-300 font-extrabold sm:hidden mt-0.5 flex items-center gap-1">
                                <span className="text-slate-400 font-normal">وكيل اللائحة:</span>
                                <span>{p.tete_liste}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <span className={isPi ? "text-sky-200 font-black text-sm sm:text-base" : "text-slate-200 font-bold text-xs sm:text-sm"}>
                          {p.tete_liste || 'غير محدد'}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-left font-black text-amber-300 text-base sm:text-xl md:text-2xl whitespace-nowrap drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {p.total_voix.toLocaleString('ar-MA')}
                      </td>
                      <td className={`p-3 sm:p-4 text-left font-black whitespace-nowrap ${isPi ? 'text-sky-300 text-base sm:text-lg drop-shadow-sm' : 'text-sky-400 text-sm sm:text-base'}`}>
                        {p.pourcentage}%
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
