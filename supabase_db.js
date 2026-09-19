import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export function isSupabaseConfigured() {
  return !!supabase;
}

export async function initSupabaseDb() {
  if (!supabase) return false;
  console.log('⚡ Base de données Cloud Supabase active !');
  return true;
}

export async function getPartisSupabase() {
  const { data, error } = await supabase
    .from('partis_politiques')
    .select('*')
    .order('ordre_affichage', { ascending: true });

  if (error) throw error;
  return data.map(r => ({
    id: r.id,
    code: r.code,
    nom_parti: r.nom_parti,
    nom_arabe: r.nom_arabe || '',
    sigle_arabe: r.sigle_arabe || '',
    couleur_hex: r.couleur_hex || '#0066B3',
    tete_liste: r.tete_liste || '',
    logo_icon: r.logo_icon || 'Vote',
    ordre_affichage: r.ordre_affichage || 0
  }));
}

export async function getBureauxSupabase(commune = '') {
  let query = supabase.from('bureaux_vote').select('*');
  if (commune && commune !== 'ALL') {
    query = query.eq('commune', commune);
  }
  const { data: bureaux, error: errB } = await query.order('commune').order('numero_bureau');
  if (errB) throw errB;

  const { data: pvs, error: errP } = await supabase.from('pv_bureaux').select('*');
  if (errP) throw errP;

  const pvMap = {};
  if (pvs) {
    pvs.forEach(p => { pvMap[p.bureau_id] = p; });
  }

  return bureaux.map(b => {
    const pv = pvMap[b.id];
    return {
      id: b.id,
      code_bureau: b.code_bureau,
      commune: b.commune,
      centre_vote: b.centre_vote,
      numero_bureau: b.numero_bureau,
      adresse: b.adresse || '',
      nombre_inscrits: b.nombre_inscrits || 0,
      has_pv: !!pv,
      pv: pv ? {
        id: pv.id,
        nombre_votants: pv.nombre_votants,
        bulletins_nuls: pv.bulletins_nuls,
        bulletins_blancs: pv.bulletins_blancs,
        suffrages_exprimes: pv.suffrages_exprimes,
        est_valide: pv.est_valide,
        note_anomalie: pv.note_anomalie || '',
        updated_at: pv.updated_at
      } : null
    };
  });
}

export async function savePvSupabase({ bureau_id, votants, nuls, blancs, exprimes, votes_by_parti, saisi_par }) {
  const bId = parseInt(bureau_id);
  const numVotants = parseInt(votants) || 0;
  const numNuls = parseInt(nuls) || 0;
  const numBlancs = parseInt(blancs) || 0;
  const numExprimes = parseInt(exprimes) || 0;

  const bRes = await supabase.from('bureaux_vote').select('nombre_inscrits').eq('id', bId).single();
  const numInscrits = bRes.data?.nombre_inscrits || 0;

  let totalPartis = 0;
  if (votes_by_parti) {
    Object.values(votes_by_parti).forEach(v => { totalPartis += (parseInt(v) || 0); });
  }

  let estValide = true;
  let anomalies = [];

  if (numInscrits > 0 && numVotants > numInscrits) {
    estValide = false;
    anomalies.push(`Votants (${numVotants}) > Inscrits (${numInscrits})`);
  }

  const calcExprimes = Math.max(0, numVotants - (numNuls + numBlancs));
  if (numExprimes !== calcExprimes) {
    estValide = false;
    anomalies.push(`Exprimés (${numExprimes}) != Votants - (Nuls+Blancs) (${calcExprimes})`);
  }

  if (totalPartis !== numExprimes) {
    estValide = false;
    anomalies.push(`Somme partis (${totalPartis}) != Exprimés (${numExprimes})`);
  }

  const { data: existingPv } = await supabase.from('pv_bureaux').select('id').eq('bureau_id', bId).maybeSingle();

  let pvId = null;
  const now = new Date().toISOString();

  if (existingPv) {
    pvId = existingPv.id;
    await supabase.from('pv_bureaux').update({
      nombre_votants: numVotants,
      bulletins_nuls: numNuls,
      bulletins_blancs: numBlancs,
      suffrages_exprimes: numExprimes,
      est_valide: estValide,
      note_anomalie: anomalies.join(' | '),
      saisi_par: saisi_par || 'responsable',
      updated_at: now
    }).eq('id', pvId);
  } else {
    const { data: insertedPv, error: insErr } = await supabase.from('pv_bureaux').insert({
      bureau_id: bId,
      nombre_votants: numVotants,
      bulletins_nuls: numNuls,
      bulletins_blancs: numBlancs,
      suffrages_exprimes: numExprimes,
      est_valide: estValide,
      note_anomalie: anomalies.join(' | '),
      saisi_par: saisi_par || 'responsable',
      created_at: now,
      updated_at: now
    }).select('id').single();

    if (insErr) throw insErr;
    pvId = insertedPv.id;
  }

  if (votes_by_parti && pvId) {
    for (const [partiIdStr, val] of Object.entries(votes_by_parti)) {
      const pId = parseInt(partiIdStr);
      const voix = parseInt(val) || 0;
      await supabase.from('votes_partis').upsert({
        pv_id: pvId,
        parti_id: pId,
        nombre_voix: voix
      }, { onConflict: 'pv_id,parti_id' });
    }
  }

  return { success: true, pv_id: pvId, est_valide: estValide, note_anomalie: anomalies.join(' | ') };
}
