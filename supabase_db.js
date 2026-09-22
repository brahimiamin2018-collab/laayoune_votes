import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://zkpmkdqqbqwayescbzns.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_kC-Eo4QnS1fveDhOutUcLA_uC5Wx3in";

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export function isSupabaseConfigured() {
  return !!supabase;
}

export async function initSupabaseDb() {
  if (!supabase) return false;
  console.log('⚡ Base de données Cloud Supabase active !');
  ensurePartisSupabase();
  return true;
}

async function ensurePartisSupabase() {
  if (!supabase) return;
  try {
    const newPartis = [
      { code: 'UMD', nom_parti: 'Union Marocaine pour la Démocratie', nom_arabe: 'حزب الاتحاد المغربي للديمقراطية', sigle_arabe: 'اتحاد ديمقراطي', couleur_hex: '#D97706', tete_liste: 'Candidat UMD Tan-Tan', ordre_affichage: 11 },
      { code: 'PE', nom_parti: 'Parti de l\'Espoir', nom_arabe: 'حزب الأمل', sigle_arabe: 'أمل', couleur_hex: '#059669', tete_liste: 'Candidat PE Tan-Tan', ordre_affichage: 12 }
    ];
    for (const p of newPartis) {
      const { data } = await supabase.from('partis_politiques').select('id').eq('code', p.code).maybeSingle();
      if (!data) {
        await supabase.from('partis_politiques').insert(p);
      }
    }
  } catch (e) {
    console.error('Erreur auto-insert partis Supabase:', e);
  }
}

export async function getPartisSupabase() {
  await ensurePartisSupabase();
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
  
  let bureaux = [];
  let fromB = 0;
  while (true) {
    const { data: pageB, error: errB } = await query.order('commune').order('numero_bureau').range(fromB, fromB + 999);
    if (errB) throw errB;
    if (!pageB || pageB.length === 0) break;
    bureaux.push(...pageB);
    if (pageB.length < 1000) break;
    fromB += 1000;
  }

  let pvs = [];
  let fromP = 0;
  while (true) {
    const { data: pageP, error: errP } = await supabase.from('pv_bureaux').select('*').range(fromP, fromP + 999);
    if (errP) throw errP;
    if (!pageP || pageP.length === 0) break;
    pvs.push(...pageP);
    if (pageP.length < 1000) break;
    fromP += 1000;
  }

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

// ----------------------------------------------------
// PARTIS POLITIQUE SUPABASE CRUD
// ----------------------------------------------------
export async function addPartiSupabase({ code, nom_parti, nom_arabe = '', sigle_arabe = '', couleur_hex = '#0066B3', tete_liste = '', logo_icon = 'Vote', ordre_affichage = 0 }) {
  const { data, error } = await supabase.from('partis_politiques').insert({
    code: code.trim().toUpperCase(),
    nom_parti: nom_parti.trim(),
    nom_arabe: (nom_arabe || '').trim(),
    sigle_arabe: (sigle_arabe || '').trim(),
    couleur_hex: (couleur_hex || '#0066B3').trim(),
    tete_liste: (tete_liste || '').trim(),
    logo_icon: (logo_icon || 'Vote').trim(),
    ordre_affichage: parseInt(ordre_affichage) || 0
  }).select('id').single();

  if (error) throw error;
  return { id: data.id, success: true };
}

export async function updatePartiSupabase(id, { code, nom_parti, nom_arabe, sigle_arabe, couleur_hex, tete_liste, logo_icon, ordre_affichage }) {
  const { error } = await supabase.from('partis_politiques').update({
    code: code.trim().toUpperCase(),
    nom_parti: nom_parti.trim(),
    nom_arabe: (nom_arabe || '').trim(),
    sigle_arabe: (sigle_arabe || '').trim(),
    couleur_hex: (couleur_hex || '#0066B3').trim(),
    tete_liste: (tete_liste || '').trim(),
    logo_icon: (logo_icon || 'Vote').trim(),
    ordre_affichage: parseInt(ordre_affichage) || 0
  }).eq('id', parseInt(id));

  if (error) throw error;
  return { success: true };
}

export async function deletePartiSupabase(id) {
  await supabase.from('votes_partis').delete().eq('parti_id', parseInt(id));
  const { error } = await supabase.from('partis_politiques').delete().eq('id', parseInt(id));
  if (error) throw error;
  return { success: true };
}

// ----------------------------------------------------
// BUREAUX VOTE SUPABASE CRUD
// ----------------------------------------------------
export async function addBureauSupabase({ code_bureau, commune, centre_vote, numero_bureau, adresse = '', nombre_inscrits = 0 }) {
  const { data, error } = await supabase.from('bureaux_vote').insert({
    code_bureau: code_bureau.trim(),
    commune: commune.trim(),
    centre_vote: centre_vote.trim(),
    numero_bureau: parseInt(numero_bureau) || 1,
    adresse: (adresse || '').trim(),
    nombre_inscrits: parseInt(nombre_inscrits) || 0
  }).select('id').single();

  if (error) throw error;
  return { id: data.id, success: true };
}

export async function updateBureauSupabase(id, { code_bureau, commune, centre_vote, numero_bureau, adresse, nombre_inscrits }) {
  const { error } = await supabase.from('bureaux_vote').update({
    code_bureau: code_bureau.trim(),
    commune: commune.trim(),
    centre_vote: centre_vote.trim(),
    numero_bureau: parseInt(numero_bureau) || 1,
    adresse: (adresse || '').trim(),
    nombre_inscrits: parseInt(nombre_inscrits) || 0
  }).eq('id', parseInt(id));

  if (error) throw error;
  return { success: true };
}

export async function deleteBureauSupabase(id) {
  const { data: pv } = await supabase.from('pv_bureaux').select('id').eq('bureau_id', parseInt(id)).maybeSingle();
  if (pv) {
    await supabase.from('votes_partis').delete().eq('pv_id', pv.id);
    await supabase.from('pv_bureaux').delete().eq('id', pv.id);
  }
  const { error } = await supabase.from('bureaux_vote').delete().eq('id', parseInt(id));
  if (error) throw error;
  return { success: true };
}

// ----------------------------------------------------
// UTILISATEURS SUPABASE CRUD
// ----------------------------------------------------
export async function addUserSupabase({ username, password, role = 'responsable', bureau_id = null, nom_responsable = '', tel = '' }) {
  const cleanUser = username.trim().toLowerCase();
  const { data, error } = await supabase.from('utilisateurs').insert({
    username: cleanUser,
    password: password.trim(),
    role,
    bureau_id: bureau_id ? parseInt(bureau_id) : null,
    nom_responsable: (nom_responsable || '').trim(),
    tel: (tel || '').trim(),
    created_at: new Date().toISOString()
  }).select('id').single();

  if (error) throw error;
  return { id: data.id, success: true };
}

export async function updateUserSupabase(id, { username, password, role, bureau_id, nom_responsable, tel }) {
  const cleanUser = username.trim().toLowerCase();
  const { error } = await supabase.from('utilisateurs').update({
    username: cleanUser,
    password: password.trim(),
    role,
    bureau_id: bureau_id ? parseInt(bureau_id) : null,
    nom_responsable: (nom_responsable || '').trim(),
    tel: (tel || '').trim()
  }).eq('id', parseInt(id));

  if (error) throw error;
  return { success: true };
}

export async function deleteUserSupabase(id) {
  const { error } = await supabase.from('utilisateurs').delete().eq('id', parseInt(id));
  if (error) throw error;
  return { success: true };
}

export async function clearPvSupabase(bureau_id) {
  const bId = parseInt(bureau_id);
  const { data: pv } = await supabase.from('pv_bureaux').select('id').eq('bureau_id', bId).maybeSingle();
  if (pv) {
    await supabase.from('votes_partis').delete().eq('pv_id', pv.id);
    await supabase.from('pv_bureaux').delete().eq('id', pv.id);
  }
  return { success: true };
}
