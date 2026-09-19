import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle2, RefreshCw, Calculator, FileText, Search, Building2, Vote } from 'lucide-react';

export default function PvEntryGrid({ assignedBureauId, session, onSaveSuccess }) {
  const [bureaux, setBureaux] = useState([]);
  const [partis, setPartis] = useState([]);
  const [selectedBureauId, setSelectedBureauId] = useState(assignedBureauId ? assignedBureauId.toString() : '');
  const [selectedCommune, setSelectedCommune] = useState('ALL');
  const [searchBureau, setSearchBureau] = useState('');

  const isRestricted = !!assignedBureauId;

  const [votants, setVotants] = useState('');
  const [nuls, setNuls] = useState('');
  const [blancs, setBlancs] = useState('');
  const [exprimes, setExprimes] = useState('');
  const [votesByParti, setVotesByParti] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Load parties list always, and bureaux list only for Admin
  useEffect(() => {
    loadInitialData();
  }, [selectedCommune, assignedBureauId]);

  // Load PV data whenever selectedBureauId changes
  useEffect(() => {
    if (selectedBureauId) {
      loadPvForBureau(selectedBureauId);
    } else {
      resetForm();
    }
  }, [selectedBureauId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const resP = await fetch('/api/depouillement/partis');
      if (resP.ok) {
        const loadedPartis = await resP.json();
        setPartis(loadedPartis);
      }

      if (isRestricted) {
        // Restricted mode: only set selectedBureauId
        setSelectedBureauId(assignedBureauId.toString());
        // Fetch bureau list containing just this bureau or fetch PV directly
        const resB = await fetch('/api/depouillement/bureaux');
        if (resB.ok) {
          const allB = await resB.json();
          setBureaux(allB);
        }
      } else {
        // Admin mode: fetch all bureaux
        const url = selectedCommune && selectedCommune !== 'ALL' 
          ? `/api/depouillement/bureaux?commune=${encodeURIComponent(selectedCommune)}` 
          : '/api/depouillement/bureaux';
        const resB = await fetch(url);
        if (resB.ok) {
          const loadedBureaux = await resB.json();
          setBureaux(loadedBureaux);
        }
      }
    } catch (err) {
      console.error('Erreur chargement initial:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPvForBureau = async (bureauId) => {
    try {
      const res = await fetch(`/api/depouillement/pv/${bureauId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.pv) {
          setVotants(data.pv.nombre_votants ? data.pv.nombre_votants.toString() : '');
          setNuls(data.pv.bulletins_nuls !== undefined ? data.pv.bulletins_nuls.toString() : '0');
          setBlancs(data.pv.bulletins_blancs !== undefined ? data.pv.bulletins_blancs.toString() : '0');
          setExprimes(data.pv.suffrages_exprimes ? data.pv.suffrages_exprimes.toString() : '');

          const initialVotes = {};
          if (data.votes) {
            Object.keys(data.votes).forEach(pId => {
              initialVotes[pId] = data.votes[pId].toString();
            });
          }
          setVotesByParti(initialVotes);
        } else {
          resetForm();
        }
      }
    } catch (err) {
      console.error('Erreur chargement PV:', err);
    }
  };

  const resetForm = () => {
    setVotants('');
    setNuls('0');
    setBlancs('0');
    setExprimes('');
    setVotesByParti({});
    setStatusMsg(null);
  };

  const numVotants = parseInt(votants) || 0;
  const numNuls = parseInt(nuls) || 0;
  const numBlancs = parseInt(blancs) || 0;
  const numExprimes = parseInt(exprimes) || 0;

  const calculatedExprimes = Math.max(0, numVotants - (numNuls + numBlancs));
  
  let totalVotesPartis = 0;
  Object.values(votesByParti).forEach(v => {
    totalVotesPartis += (parseInt(v) || 0);
  });

  // Determine active bureau object
  const selectedBureauObj = bureaux.find(b => b.id.toString() === selectedBureauId?.toString()) || 
    (session?.bureau_details ? {
      id: session.bureau_details.id,
      code_bureau: session.bureau_details.code_bureau,
      commune: session.bureau_details.commune,
      centre_vote: session.bureau_details.centre_vote,
      numero_bureau: session.bureau_details.numero_bureau,
      nombre_inscrits: session.bureau_details.nombre_inscrits
    } : null);

  const numInscrits = selectedBureauObj?.nombre_inscrits || 0;

  const isVotantsValid = numVotants <= numInscrits || numInscrits === 0;
  const isExprimesMatch = numExprimes === calculatedExprimes && numVotants > 0;
  const isPartisVotesMatch = totalVotesPartis === numExprimes && numExprimes > 0;
  const isFullyValid = isVotantsValid && isExprimesMatch && isPartisVotesMatch;

  const handleAutoCalcExprimes = () => {
    setExprimes(calculatedExprimes.toString());
  };

  const handleVoteChange = (partiId, val) => {
    setVotesByParti(prev => ({ ...prev, [partiId]: val }));
  };

  const handleSubmitPv = async (e) => {
    e.preventDefault();
    if (!selectedBureauId) return;

    setSaving(true);
    setStatusMsg(null);

    try {
      const payload = {
        bureau_id: parseInt(selectedBureauId),
        votants: numVotants,
        nuls: numNuls,
        blancs: numBlancs,
        exprimes: numExprimes,
        votes_by_parti: votesByParti,
        saisi_par: session?.username || 'responsable'
      };

      const res = await fetch('/api/depouillement/pv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.est_valide) {
          setStatusMsg({ type: 'success', text: 'Procès-Verbal (PV) enregistré et validé avec succès !' });
        } else {
          setStatusMsg({ type: 'warning', text: `PV enregistré avec avertissement : ${json.note_anomalie}` });
        }
        await loadInitialData();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const errJson = await res.json();
        setStatusMsg({ type: 'error', text: errJson.error || 'Erreur d\'enregistrement.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const filteredBureauxList = bureaux.filter(b => 
    b.code_bureau.toLowerCase().includes(searchBureau.toLowerCase()) ||
    b.centre_vote.toLowerCase().includes(searchBureau.toLowerCase()) ||
    b.numero_bureau.toString().includes(searchBureau)
  );

  return (
    <div className="space-y-6">
      
      {/* Header filter bar (Admin ONLY) */}
      {!isRestricted && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              Saisie des Procès-Verbaux de Dépouillement (PV)
            </h2>
            <p className="text-xs text-slate-400">
              Saisissez les résultats bureau par bureau avec vérification d'intégrité en temps réel.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400">Commune :</span>
            <select
              value={selectedCommune}
              onChange={(e) => {
                setSelectedCommune(e.target.value);
                setSelectedBureauId('');
              }}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Toutes les Communes</option>
              <option value="Tan-Tan">Tan-Tan Ville</option>
              <option value="El Ouatia">El Ouatia</option>
              <option value="Abteh">Abteh</option>
              <option value="Ben Khlil">Ben Khlil</option>
              <option value="Chbika">Chbika</option>
              <option value="Msied">Msied</option>
              <option value="Tilemzoune">Tilemzoune</option>
            </select>
          </div>
        </div>
      )}

      <div className={isRestricted ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-6"}>
        
        {/* Bureaux List Column (Admin ONLY) */}
        {!isRestricted && (
          <div className="lg:col-span-4 glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col h-[640px]">
            <div className="mb-3 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-sky-400" />
                Sélectionner le Bureau de Vote ({filteredBureauxList.length})
              </label>
              <input
                type="text"
                placeholder="Chercher par N° bureau, centre..."
                value={searchBureau}
                onChange={(e) => setSearchBureau(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {filteredBureauxList.map((b) => {
                const isSelected = selectedBureauId.toString() === b.id.toString();
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBureauId(b.id.toString())}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-md shadow-sky-500/10'
                        : b.has_pv
                        ? b.pv?.est_valide
                          ? 'bg-slate-900/60 border-emerald-500/30 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-900/60 border-rose-500/30 text-slate-300 hover:bg-slate-800'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span className="text-sky-300">{b.code_bureau}</span>
                        <span className="text-slate-200">BV N°{b.numero_bureau}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {b.centre_vote} ({b.commune})
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {b.has_pv ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.pv?.est_valide
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {b.pv?.est_valide ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {b.pv?.suffrages_exprimes} voix
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Non dépouillé</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PV Form Column */}
        <div className={isRestricted ? "w-full" : "lg:col-span-8"}>
          
          {selectedBureauObj ? (
            <form onSubmit={handleSubmitPv} className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-6 shadow-2xl">
              
              {/* Form Title & Bureau Info */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                <div>
                  <div className="text-[11px] text-sky-400 font-extrabold uppercase tracking-wider">
                    Procès-Verbal Officiel de Dépouillement
                  </div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                    <span>{selectedBureauObj.centre_vote}</span>
                    <span className="text-sky-300 font-bold">• Bureau N°{selectedBureauObj.numero_bureau} ({selectedBureauObj.code_bureau})</span>
                  </h3>
                  <div className="text-xs text-slate-400 mt-1">
                    Commune de <strong className="text-white">{selectedBureauObj.commune}</strong> • Nombre d'électeurs inscrits : <strong className="text-sky-300 font-bold">{numInscrits}</strong>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isFullyValid ? (
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>PV Conforme</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold shadow-md shadow-amber-500/10">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Saisie à compléter</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Message */}
              {statusMsg && (
                <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : statusMsg.type === 'warning'
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}>
                  {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Step 1: Données Globale du Bureau */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Calculator className="w-4 h-4 text-sky-400" />
                  <span>1. Chiffres Globaux du Bureau</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">Nombre Votants</label>
                    <input
                      type="number"
                      min="0"
                      value={votants}
                      onChange={(e) => setVotants(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">Bulletins Nuls</label>
                    <input
                      type="number"
                      min="0"
                      value={nuls}
                      onChange={(e) => setNuls(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">Bulletins Blancs</label>
                    <input
                      type="number"
                      min="0"
                      value={blancs}
                      onChange={(e) => setBlancs(e.target.value)}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold">Suffrages Exprimés</label>
                      <button
                        type="button"
                        onClick={handleAutoCalcExprimes}
                        className="text-[10px] text-sky-400 underline font-extrabold hover:text-sky-300"
                      >
                        Auto
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={exprimes}
                      onChange={(e) => setExprimes(e.target.value)}
                      placeholder="0"
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-white font-bold text-sm focus:outline-none ${
                        isExprimesMatch ? 'border-emerald-500/50 text-emerald-300' : 'border-amber-500/50 text-amber-300'
                      }`}
                      required
                    />
                  </div>
                </div>

                {numVotants > 0 && (
                  <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-[11px] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-400">
                      Vérification : <strong>{numVotants} votants - ({numNuls} nuls + {numBlancs} blancs) = {calculatedExprimes} exprimés</strong>
                    </span>
                    {isExprimesMatch ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Total Exprimés Conforme
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Écart calculé ({calculatedExprimes}) vs saisi ({numExprimes})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Partis Votes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Vote className="w-4 h-4 text-sky-400" />
                    <span>2. Saisie des Voix par Parti Politique</span>
                  </h4>
                  
                  <div className="text-xs font-semibold">
                    <span className="text-slate-400">Total Voix Partis : </span>
                    <span className={`font-extrabold ${isPartisVotesMatch ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {totalVotesPartis} / {numExprimes} exprimés
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {partis.map((p) => {
                    const partyVote = votesByParti[p.id] || '';
                    return (
                      <div 
                        key={p.id}
                        className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: p.couleur_hex }}
                          ></div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">
                              {p.code} <span className="font-normal text-slate-400">({p.sigle_arabe || p.nom_parti})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {p.nom_parti}
                            </div>
                          </div>
                        </div>

                        <input
                          type="number"
                          min="0"
                          value={partyVote}
                          onChange={(e) => handleVoteChange(p.id, e.target.value)}
                          placeholder="0"
                          className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-right font-extrabold text-white text-sm focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Réinitialiser
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg transition ${
                    isFullyValid
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/20'
                  }`}
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Enregistrement en cours...' : 'Enregistrer le PV'}</span>
                </button>
              </div>

            </form>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              <h3 className="text-base font-bold text-white">Chargement des données du bureau...</h3>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
