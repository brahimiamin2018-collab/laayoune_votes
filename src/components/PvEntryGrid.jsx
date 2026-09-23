import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle2, RefreshCw, Calculator, FileText, Search, Building2, Vote, Lock, Unlock, X, ShieldAlert, Trash2 } from 'lucide-react';
import PartySymbol from './PartySymbol';

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
  const [clearing, setClearing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
        setSelectedBureauId(assignedBureauId.toString());
        const resB = await fetch('/api/depouillement/bureaux');
        if (resB.ok) {
          const allB = await resB.json();
          setBureaux(allB);
        }
      } else {
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
          // Lock entry if PV was already validated and saved
          if (data.pv.est_valide || data.pv.suffrages_exprimes > 0) {
            setIsLocked(true);
          } else {
            setIsLocked(false);
          }
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
    setIsLocked(false);
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

  const selectedBureauObj = bureaux.find(b => b.id.toString() === selectedBureauId?.toString()) || 
    (session?.bureau_details ? {
      id: session.bureau_details.id,
      code_bureau: session.bureau_details.code_bureau,
      commune: session.bureau_details.commune,
      centre_vote: session.bureau_details.centre_vote,
      numero_bureau: session.bureau_details.numero_bureau
    } : null);

  // Automatic calculation of suffrages exprimés: votants - (nuls + blancs)
  useEffect(() => {
    if (!isLocked && votants !== '') {
      const calc = Math.max(0, numVotants - (numNuls + numBlancs));
      setExprimes(calc.toString());
    }
  }, [votants, nuls, blancs, isLocked]);

  const isPartisVotesMatch = totalVotesPartis === numExprimes && numExprimes > 0;

  const handleAutoCalcExprimes = () => {
    if (isLocked) return;
    setExprimes(calculatedExprimes.toString());
  };

  const handleVoteChange = (partiId, val) => {
    if (isLocked) return;
    setVotesByParti(prev => ({ ...prev, [partiId]: val }));
  };

  // Step 1: Open Confirmation Modal
  const handlePreSubmitPv = (e) => {
    e.preventDefault();
    if (!selectedBureauId || isLocked) return;
    setShowConfirmModal(true);
  };

  // Step 2: Execute Save PV after confirmation
  const executeSavePv = async () => {
    setShowConfirmModal(false);
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
        setStatusMsg({ type: 'success', text: 'تم حفظ وتأكيد المحضر وإقفال إدخال البيانات لهذا المكتب بنجاح!' });
        setIsLocked(true);
        await loadInitialData();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const errJson = await res.json();
        setStatusMsg({ type: 'error', text: errJson.error || 'حدث خطأ أثناء الحفظ.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClearPv = async () => {
    if (!selectedBureauId) return;
    if (!window.confirm('⚠️ هل أنت تأكد من رغبتك في تفريغ وإلغاء كافة بيانات المحضر لهذا المكتب؟\n\nسيتم حذف نتائج أصوات الأحزاب المسجلة وإعادة فتح المكتب لإعادة الإدخال من جديد.')) {
      return;
    }
    setClearing(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/depouillement/pv/${selectedBureauId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        resetForm();
        setStatusMsg({ type: 'success', text: 'تم تفريغ بيانات المحضر وإعادة فتح المكتب للإدخال بنجاح!' });
        await loadInitialData();
        if (onSaveSuccess) onSaveSuccess();
      } else {
        const errJson = await res.json();
        setStatusMsg({ type: 'error', text: errJson.error || 'حدث خطأ أثناء تفريغ بيانات المحضر.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setClearing(false);
    }
  };

  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const filteredBureauxList = bureaux.filter(b => {
    const matchesSearch = 
      b.code_bureau.toLowerCase().includes(searchBureau.toLowerCase()) ||
      b.centre_vote.toLowerCase().includes(searchBureau.toLowerCase()) ||
      b.numero_bureau.toString().includes(searchBureau);

    const matchesStatus = 
      selectedStatus === 'ALL' ? true :
      selectedStatus === 'DEPOUILLE' ? b.has_pv :
      selectedStatus === 'NON_DEPOUILLE' ? !b.has_pv : true;

    return matchesSearch && matchesStatus;
  });

  const depouillesCount = bureaux.filter(b => b.has_pv).length;
  const nonDepouillesCount = bureaux.filter(b => !b.has_pv).length;

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header filter bar (Admin ONLY) */}
      {!isRestricted && (
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-400" />
              إدخال محاضر الفرز (PV)
            </h2>
            <p className="text-xs text-slate-400">
              إدخال نتائج مكاتب التصويت مع التحقق المباشر من صحة البيانات.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400">الجماعة :</span>
              <select
                value={selectedCommune}
                onChange={(e) => {
                  setSelectedCommune(e.target.value);
                  setSelectedBureauId('');
                }}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
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

            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">حالة الفرز :</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-slate-900 text-white">جميع المكاتب ({bureaux.length})</option>
                <option value="DEPOUILLE" className="bg-slate-900 text-emerald-300">المكاتب المفروزة ({depouillesCount})</option>
                <option value="NON_DEPOUILLE" className="bg-slate-900 text-amber-300">المكاتب الغير مفروزة ({nonDepouillesCount})</option>
              </select>
            </div>
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
                اختر مكتب التصويت ({filteredBureauxList.length})
              </label>
              <input
                type="text"
                placeholder="البحث برقم المكتب، المركز..."
                value={searchBureau}
                onChange={(e) => setSearchBureau(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pl-1 text-xs">
              {filteredBureauxList.map((b) => {
                const isSelected = selectedBureauId.toString() === b.id.toString();
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBureauId(b.id.toString())}
                    className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-md shadow-sky-500/10'
                        : b.has_pv
                        ? 'bg-slate-900/60 border-emerald-500/30 text-slate-300 hover:bg-slate-800'
                        : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        <span className="text-sky-300">{b.code_bureau}</span>
                        <span className="text-slate-200">مكتب رقم {b.numero_bureau}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {b.centre_vote} ({b.commune})
                      </div>
                    </div>

                    <div className="text-left flex-shrink-0">
                      {b.has_pv ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          {b.pv?.suffrages_exprimes} صوت
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">غير مفروز</span>
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
            <form onSubmit={handlePreSubmitPv} className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-6 shadow-2xl">
              
              {/* Lock Banner if PV is confirmed */}
              {isLocked && (
                <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs font-extrabold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />
                    <span>تم تأكيد وقفل المحضر النهائي لهذا المكتب. الأرقام محفورة ومحفوظة ضد التعديل.</span>
                  </div>
                  {session?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setIsLocked(false)}
                      className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition flex-shrink-0"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>إلغاء التجميد للتعديل (مدير)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Form Title & Bureau Info */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                <div>
                  <div className="text-[11px] text-sky-400 font-extrabold uppercase tracking-wider">
                    محضر الفرز الرسمي
                  </div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                    <span>{selectedBureauObj.centre_vote}</span>
                    <span className="text-sky-300 font-bold">• مكتب رقم {selectedBureauObj.numero_bureau} ({selectedBureauObj.code_bureau})</span>
                  </h3>
                  <div className="text-xs text-slate-400 mt-1">
                    جماعة <strong className="text-white">{selectedBureauObj.commune}</strong>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isLocked ? (
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-black shadow-md shadow-emerald-500/10">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>محضر مقفل ومؤكد</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500/20 border border-sky-500/40 text-sky-300 rounded-xl text-xs font-bold shadow-md shadow-sky-500/10">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span>إدخال النتائج</span>
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
                  <span>1. الأرقام الإجمالية للمكتب</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">عدد المصوتين</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      value={votants}
                      disabled={isLocked}
                      onChange={(e) => setVotants(e.target.value)}
                      placeholder="0"
                      className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-sm focus:outline-none ${
                        isLocked 
                          ? 'bg-slate-900/60 border border-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-950 border border-slate-800 text-white focus:border-sky-500'
                      }`}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">الأوراق الملغاة</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      value={nuls}
                      disabled={isLocked}
                      onChange={(e) => setNuls(e.target.value)}
                      placeholder="0"
                      className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-sm focus:outline-none ${
                        isLocked 
                          ? 'bg-slate-900/60 border border-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-950 border border-slate-800 text-white focus:border-sky-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-semibold">الأوراق البيضاء</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      value={blancs}
                      disabled={isLocked}
                      onChange={(e) => setBlancs(e.target.value)}
                      placeholder="0"
                      className={`w-full px-3.5 py-2.5 rounded-xl font-bold text-sm focus:outline-none ${
                        isLocked 
                          ? 'bg-slate-900/60 border border-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-950 border border-slate-800 text-white focus:border-sky-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-semibold">الأصوات المعبر عنها</label>
                      <span className="text-[10px] text-sky-300 font-black bg-sky-500/15 px-2 py-0.5 rounded-lg border border-sky-500/30">
                        حساب تلقائي
                      </span>
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min="0"
                      value={exprimes}
                      disabled={isLocked}
                      onChange={(e) => setExprimes(e.target.value)}
                      placeholder="0"
                      className={`w-full px-3.5 py-2.5 rounded-xl font-extrabold text-sm focus:outline-none ${
                        isLocked
                          ? 'bg-slate-900/60 border border-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-950 border border-sky-500/40 text-sky-200 focus:border-sky-400'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Partis Votes */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Vote className="w-4 h-4 text-sky-400" />
                    <span>2. إدخال أصوات الأحزاب السياسية</span>
                  </h4>
                  
                  <div className="text-xs font-semibold flex items-center gap-2">
                    <span className="text-slate-400">مجموع أصوات الأحزاب : </span>
                    <span className={`font-black px-2.5 py-0.5 rounded-lg border transition ${
                      numExprimes === 0
                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                        : isPartisVotesMatch
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    }`}>
                      {totalVotesPartis} / {numExprimes} معبر عنها
                    </span>
                  </div>
                </div>

                {numExprimes > 0 && (
                  <div className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center justify-between gap-2 transition ${
                    isPartisVotesMatch
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    <div className="flex items-center gap-2">
                      {isPartisVotesMatch ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                      <span>
                        {isPartisVotesMatch
                          ? `مجموع أصوات الأحزاب (${totalVotesPartis}) مطابق تماماً للأصوات المعبر عنها (${numExprimes}).`
                          : `تفاوت : مجموع أصوات الأحزاب (${totalVotesPartis}) لا يساوي الأصوات المعبر عنها (${numExprimes}). الفرق: ${Math.abs(totalVotesPartis - numExprimes)} صوت.`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {partis.map((p) => {
                    const partyVote = votesByParti[p.id] || '';
                    return (
                      <div 
                        key={p.id}
                        className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PartySymbol code={p.code} couleurHex={p.couleur_hex} logoIcon={p.logo_icon} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                              <span className="text-sky-300 font-black">{p.nom_arabe || p.nom_parti}</span>
                              <span className="text-slate-400 font-normal">({p.code})</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {p.nom_parti}
                            </div>
                          </div>
                        </div>

                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          value={partyVote}
                          disabled={isLocked}
                          onChange={(e) => handleVoteChange(p.id, e.target.value)}
                          placeholder="0"
                          className={`w-24 px-3 py-1.5 rounded-xl text-left font-extrabold text-sm focus:outline-none ${
                            isLocked 
                              ? 'bg-slate-900/60 border border-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-slate-900 border border-slate-700 text-white focus:border-sky-500'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                    >
                      إعادة ضبط
                    </button>
                  )}
                  {session?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={handleClearPv}
                      disabled={clearing}
                      className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm"
                    >
                      {clearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{clearing ? 'جاري التفريغ...' : 'تفريغ بيانات المحضر (مدير)'}</span>
                    </button>
                  )}
                </div>

                <div className="mr-auto">
                  <button
                    type="submit"
                    disabled={saving || isLocked}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition ${
                      isLocked
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-500/20'
                    }`}
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'جاري الحفظ...' : isLocked ? 'المحضر مقفل ومؤكد' : 'تأكيد وقفل المحضر'}</span>
                  </button>
                </div>
              </div>

            </form>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
              <h3 className="text-base font-bold text-white">جاري تحميل بيانات المكتب...</h3>
            </div>
          )}

        </div>

      </div>

      {/* Confirmation Modal before locking & saving PV */}
      {showConfirmModal && selectedBureauObj && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="glass-panel border-2 border-sky-400/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-auto bg-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    تأكيد وقفل نتائج المحضر
                  </h3>
                  <div className="text-xs text-sky-300 font-bold">
                    {selectedBureauObj.centre_vote} - مكتب رقم {selectedBureauObj.numero_bureau}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-xs font-semibold">
              ⚠️ <strong>تنبيه هام:</strong> يرجى مراجعة وتأكيد الأرقام أسفله. بعد الضغط على زر "تأكيد وقفل المحضر"، سيتم تجميد البيانات وقفل الإدخال لهذا المكتب لمنع الأخطاء.
            </div>

            {/* Summary Box */}
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs text-slate-200">
              <div className="flex justify-between border-b border-slate-800 pb-2 font-bold">
                <span>عدد المصوتين:</span>
                <span className="text-white font-black text-sm">{numVotants}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">الملغاة / البيضاء:</span>
                <span>{numNuls} ملغاة / {numBlancs} بيضاء</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2 font-bold">
                <span className="text-emerald-400">الأصوات المعبر عنها:</span>
                <span className="text-emerald-300 font-black text-sm">{numExprimes}</span>
              </div>

              <div className="pt-1">
                <div className="font-extrabold text-sky-400 mb-2">توزيع أصوات الأحزاب:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {partis.map(p => {
                    const v = votesByParti[p.id] || 0;
                    return (
                      <div key={p.id} className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="truncate font-bold text-white">{p.nom_arabe || p.code}:</span>
                        <span className="font-black text-amber-300 text-xs">{v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                تراجع وتعديل
              </button>

              <button
                type="button"
                onClick={executeSavePv}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
              >
                <Lock className="w-4 h-4" />
                <span>تأكيد وقفل المحضر النهائي</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
