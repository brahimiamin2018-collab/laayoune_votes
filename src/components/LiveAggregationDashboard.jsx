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
    XLSX.utils.book_append_sheet(wb, ws, 'Résultats Laâyoune 2026');
    XLSX.writeFile(wb, `Totaux_Votes_Laayoune_2026_${selectedCommune}.xlsx`);
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
            Tableau Général des Totaux de Votes - Laâyoune 2026
          </h2>
          <p className="text-xs text-slate-400">
            Cumul en temps réel des voix obtenues par chaque parti politique dans la circonscription de Laâyoune.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Commune :</span>
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toute la Circonscription</option>
              <option value="Laâyoune">Laâyoune Ville</option>
              <option value="El Marsa">El Marsa</option>
              <option value="Boucraa">Boucraa</option>
              <option value="Dcheira">Dcheira</option>
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
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exporter Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-xs text-sky-400 font-semibold mb-2">
            <span>Suffrages Exprimés</span>
            <Vote className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {data?.total_exprimes?.toLocaleString('fr-FR') || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Votants: {data?.total_votants?.toLocaleString('fr-FR') || 0}</span>
            <span>Nuls/Blancs: {data?.total_nuls_blancs || 0}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
            <span>Taux de Dépouillement</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">
            {data?.taux_depouillement || 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>{data?.depouilles_count || 0} / {data?.total_bureaux || 0} PVs Saisis</span>
            {data?.invalides_count > 0 && (
              <span className="text-rose-400 font-bold">{data.invalides_count} Anomalies</span>
            )}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-xs text-purple-400 font-semibold mb-2">
            <span>Taux de Participation</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">
            {data?.taux_participation || 0}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Inscrits: {data?.total_inscrits?.toLocaleString('fr-FR') || 0} électeurs
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900/50">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-2">
            <span>Parti en Tête</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          {topParty && topParty.total_voix > 0 ? (
            <div>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: topParty.couleur_hex }}></span>
                <span>{topParty.code} - {topParty.sigle_arabe || topParty.nom_parti}</span>
              </div>
              <div className="text-[11px] text-amber-300 font-medium mt-1">
                {topParty.total_voix?.toLocaleString('fr-FR')} voix ({topParty.pourcentage}%) • {topParty.sieges} siège(s)
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic mt-2">Aucun PV dépouillé pour l'instant</div>
          )}
        </div>

      </div>

      {/* Main Results Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Award className="w-4 h-4 text-sky-400" />
            <span>Classement Général des Partis Politiques ({filteredParties.length})</span>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Rechercher un parti, tête de liste..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 text-center w-12">Rang</th>
                <th className="py-3 px-4">Parti Politique</th>
                <th className="py-3 px-4">Tête de Liste</th>
                <th className="py-3 px-4 text-right">Total Voix</th>
                <th className="py-3 px-4 w-48">Répartition (%)</th>
                <th className="py-3 px-4 text-center w-28">Sièges (Est.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredParties.length > 0 ? (
                filteredParties.map((p) => {
                  const isWinner = p.rang === 1 && p.total_voix > 0;
                  const hasSeats = p.sieges > 0;
                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isWinner ? 'bg-amber-500/5' : hasSeats ? 'bg-sky-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                          p.rang === 1 ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' :
                          p.rang === 2 ? 'bg-slate-300 text-slate-950' :
                          p.rang === 3 ? 'bg-amber-700 text-white' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {p.rang}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: p.couleur_hex }}
                          ></div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{p.code}</span>
                              {p.sigle_arabe && (
                                <span className="text-sky-300 text-xs font-normal">({p.sigle_arabe})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {p.nom_parti} {p.nom_arabe ? `• ${p.nom_arabe}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {p.tete_liste || <span className="text-slate-600 italic">Non spécifié</span>}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-white text-sm">
                        {p.total_voix?.toLocaleString('fr-FR')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                            <span>{p.pourcentage}%</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className="h-full transition-all duration-500 rounded-full"
                              style={{
                                width: `${Math.max(p.pourcentage, p.total_voix > 0 ? 2 : 0)}%`,
                                backgroundColor: p.couleur_hex
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {p.sieges > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-extrabold text-xs">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>{p.sieges} Siège{p.sieges > 1 ? 's' : ''}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 italic">
                    Aucun parti ne correspond à cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Attribution des Sièges : Quotient Électoral + Plus Forte Moyenne (Circonscription de Laâyoune : 3 Sièges).
          </span>
          <span className="text-slate-500">
            Élections 23 Septembre 2026
          </span>
        </div>
      </div>

    </div>
  );
}
