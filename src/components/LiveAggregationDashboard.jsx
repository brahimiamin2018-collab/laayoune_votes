import React, { useState, useEffect } from 'react';
import { BarChart3, Award, Users, CheckCircle2, AlertTriangle, FileSpreadsheet, RefreshCw, Filter, Vote } from 'lucide-react';
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
      'Rang': idx + 1,
      'Parti (Code)': p.code,
      'Nom du Parti': p.nom_parti,
      'Nom Arabe': p.nom_arabe || '',
      'Tête de Liste': p.tete_liste || '',
      'Total Voix Obtenues': p.total_voix,
      'Pourcentage (%)': `${p.pourcentage}%`,
      'Sièges Estimés (Sur 3)': p.sieges
    }));

    const summaryRow = {
      'Rang': 'TOTAL',
      'Parti (Code)': '-',
      'Nom du Parti': 'Suffrages Exprimés',
      'Nom Arabe': '',
      'Tête de Liste': '',
      'Total Voix Obtenues': data.total_exprimes,
      'Pourcentage (%)': '100%',
      'Sièges Estimés (Sur 3)': 3
    };

    const ws = XLSX.utils.json_to_sheet([...rows, {}, summaryRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Résultats Tan-Tan 2026');
    XLSX.writeFile(wb, `Totaux_Votes_Tan_Tan_2026_${selectedCommune}.xlsx`);
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
        <p className="text-sm font-medium">Chargement des totaux des votes par parti...</p>
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
    <div className="space-y-6">
      
      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-400" />
            Tableau Général des Totaux de Votes - Tan-Tan 2026
          </h2>
          <p className="text-xs text-slate-400">
            Cumul en temps réel des voix obtenues par chaque parti politique dans la circonscription de Tan-Tan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Commune :</span>
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-[200px] sm:max-w-none text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">Toute la Circonscription (جميع الجماعات - 174 bureau)</option>
              <option value="Tan-Tan" className="bg-slate-900 text-white">Tan-Tan / طانطان (81 bureau)</option>
              <option value="El Ouatia" className="bg-slate-900 text-white">El Ouatia / الوطية (18 bureau)</option>
              <option value="Ben Khlil" className="bg-slate-900 text-white">Ben Khlil / بن خليل (15 bureau)</option>
              <option value="Abteh" className="bg-slate-900 text-white">Abteh / أبطيح (15 bureau)</option>
              <option value="Chbika" className="bg-slate-900 text-white">Chbika / الشبيكة (15 bureau)</option>
              <option value="Tilemzoune" className="bg-slate-900 text-white">Tilemzoune / تلمزون (15 bureau)</option>
              <option value="Msied" className="bg-slate-900 text-white">Msied / لمسيد (15 bureau)</option>
            </select>
          </div>

          <button
            onClick={loadData}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>

          <button
            onClick={exportCloudBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-sky-600/20"
            title="Exporter & Sauvegarder la base de données globale au format JSON"
          >
            <Vote className="w-4 h-4" />
            <span>Sauvegarde Cloud JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (2x2 grid on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        <div className="glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-sky-400 font-semibold mb-1 sm:mb-2">
            <span>Dépouillement</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {data?.depouilles_count || 0} / {data?.total_bureaux || 0}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            Bureaux ({data?.taux_depouillement || 0}%)
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-blue-400 font-semibold mb-1 sm:mb-2">
            <span>Votants</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-white">
            {(data?.total_votants || 0).toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            Part. : <strong className="text-blue-300">{data?.taux_participation || 0}%</strong>
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-emerald-400 font-semibold mb-1 sm:mb-2">
            <span>Exprimés</span>
            <Vote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400">
            {(data?.total_exprimes || 0).toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            Suffrages valides
          </div>
        </div>

        <div className="glass-panel p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-amber-400 font-semibold mb-1 sm:mb-2">
            <span>En Tête</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <div className="text-base sm:text-xl font-black text-amber-300 truncate">
            {topParty ? `${topParty.nom_arabe || topParty.code} (${topParty.total_voix})` : 'Aucun'}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">
            {topParty ? `${topParty.code} - ${topParty.nom_parti}` : 'En attente'}
          </div>
        </div>

      </div>

      {/* Main Aggregation Table - Optimized for Smartphone with Arabic Party Names */}
      <div className="glass-panel p-3 sm:p-5 rounded-2xl border border-slate-800 space-y-3 sm:space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-sky-400" />
            Classement des Partis Politiques (ترتيب الأحزاب السياسية)
          </h3>
          
          <input
            type="text"
            placeholder="Rechercher / بحث عن حزب..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto -mx-1 sm:mx-0">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider bg-slate-900/60">
                <th className="p-2 sm:p-3 w-10 text-center">#</th>
                <th className="p-2 sm:p-3">Parti Politique (الحزب السياسي)</th>
                <th className="p-2 sm:p-3 hidden md:table-cell">Tête de Liste</th>
                <th className="p-2 sm:p-3 text-right">Voix</th>
                <th className="p-2 sm:p-3 text-right">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold text-slate-200">
              {filteredParties.map((p, idx) => {
                const isPi = p.code === 'PI';
                return (
                  <tr key={p.id} className={`transition ${
                    isPi 
                      ? 'bg-gradient-to-r from-sky-950/40 via-blue-950/20 to-slate-900/60 border-l-4 border-l-sky-400 shadow-md' 
                      : 'hover:bg-slate-900/40'
                  }`}>
                    <td className="p-2 sm:p-3 text-center text-slate-400 font-extrabold text-xs sm:text-sm">
                      #{idx + 1}
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex-shrink-0 shadow-sm" 
                          style={{ backgroundColor: p.couleur_hex }}
                        ></div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                            <span className="text-sky-300 font-black" dir="rtl">{p.nom_arabe || p.nom_parti}</span>
                            <span className="text-slate-400 font-bold text-[11px]">({p.code})</span>
                            {isPi && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[9px] font-black tracking-wider uppercase">
                                ★ Parti de l'Istiqlal
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px] sm:max-w-[280px]">
                            {p.nom_parti}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 hidden md:table-cell font-medium">
                      <span className={isPi ? "text-sky-200 font-bold" : "text-slate-300"}>
                        {p.tete_liste || 'Non renseigné'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3 text-right font-black text-white text-xs sm:text-sm whitespace-nowrap">
                      {p.total_voix.toLocaleString()}
                    </td>
                    <td className={`p-2 sm:p-3 text-right font-bold whitespace-nowrap ${isPi ? 'text-sky-300 font-black text-xs sm:text-sm' : 'text-sky-400 text-xs'}`}>
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
