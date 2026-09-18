import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3Module from 'sqlite3';

const sqlite3 = sqlite3Module.default || sqlite3Module;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'depouillement_laayoune.db');

let db = null;

async function getDb() {
  if (db) return db;
  return new Promise((resolve, reject) => {
    const d = new sqlite3.Database(dbPath, (err) => {
      if (err) reject(err);
      else {
        db = d;
        console.log(`💾 Base de données SQLite initialisée : ${dbPath}`);
        resolve(db);
      }
    });
  });
}

const queryLocal = async (sql, params = []) => {
  const localDb = await getDb();
  return new Promise((resolve, reject) => {
    localDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getLocal = async (sql, params = []) => {
  const localDb = await getDb();
  return new Promise((resolve, reject) => {
    localDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const runLocal = async (sql, params = []) => {
  const localDb = await getDb();
  return new Promise((resolve, reject) => {
    localDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

let isDbInitialized = false;

export async function initDb() {
  if (isDbInitialized) return;
  isDbInitialized = true;

  await runLocal(`
    CREATE TABLE IF NOT EXISTS PARTIS_POLITIQUES (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      CODE TEXT UNIQUE NOT NULL,
      NOM_PARTI TEXT NOT NULL,
      NOM_ARABE TEXT,
      SIGLE_ARABE TEXT,
      COULEUR_HEX TEXT NOT NULL,
      TETE_LISTE TEXT,
      LOGO_ICON TEXT,
      ORDRE_AFFICHAGE INTEGER DEFAULT 0
    );
  `);

  await runLocal(`
    CREATE TABLE IF NOT EXISTS BUREAUX_VOTE (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      CODE_BUREAU TEXT UNIQUE NOT NULL,
      COMMUNE TEXT NOT NULL,
      CENTRE_VOTE TEXT NOT NULL,
      NUMERO_BUREAU INTEGER NOT NULL,
      ADRESSE TEXT,
      NOMBRE_INSCRITS INTEGER DEFAULT 0
    );
  `);

  await runLocal(`
    CREATE TABLE IF NOT EXISTS PV_BUREAUX (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      BUREAU_ID INTEGER UNIQUE NOT NULL,
      NOMBRE_VOTANTS INTEGER DEFAULT 0,
      BULLETINS_NULS INTEGER DEFAULT 0,
      BULLETINS_BLANCS INTEGER DEFAULT 0,
      SUFFRAGES_EXPRIMES INTEGER DEFAULT 0,
      EST_VALIDE INTEGER DEFAULT 0,
      NOTE_ANOMALIE TEXT,
      SAISI_PAR TEXT,
      CREATED_AT TEXT,
      UPDATED_AT TEXT
    );
  `);

  await runLocal(`
    CREATE TABLE IF NOT EXISTS VOTES_PARTIS (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      PV_ID INTEGER NOT NULL,
      PARTI_ID INTEGER NOT NULL,
      NOMBRE_VOIX INTEGER DEFAULT 0,
      UNIQUE(PV_ID, PARTI_ID)
    );
  `);

  // Seed default parties
  try {
    const row = await getLocal(`SELECT COUNT(*) as count FROM PARTIS_POLITIQUES`);
    if (!row || row.count === 0) {
      const defaultPartis = [
        { code: 'RNI', nom: 'Rassemblement National des Indépendants', nom_ar: 'التجمع الوطني للأحرار', sigle_ar: 'أحرار', couleur: '#0066B3', tete: 'Candidat RNI Laâyoune', ordre: 1 },
        { code: 'PAM', nom: 'Parti Authenticité et Modernité', nom_ar: 'حزب الأصالة والمعاصرة', sigle_ar: 'أصالة', couleur: '#008080', tete: 'Candidat PAM Laâyoune', ordre: 2 },
        { code: 'PI', nom: 'Parti de l\'Istiqlal', nom_ar: 'حزب الاستقلال', sigle_ar: 'استقلال', couleur: '#1E3A8A', tete: 'Candidat PI Laâyoune', ordre: 3 },
        { code: 'USFP', nom: 'Union Socialiste des Forces Populaires', nom_ar: 'الاتحاد الاشتراكي للقوات الشعبية', sigle_ar: 'اتحاد اشتراكي', couleur: '#DC2626', tete: 'Candidat USFP Laâyoune', ordre: 4 },
        { code: 'MP', nom: 'Mouvement Populaire', nom_ar: 'الحركة الشعبية', sigle_ar: 'حركة', couleur: '#16A34A', tete: 'Candidat MP Laâyoune', ordre: 5 },
        { code: 'PPS', nom: 'Parti du Progrès et du Socialisme', nom_ar: 'حزب التقدم والاشتراكية', sigle_ar: 'تقدم', couleur: '#0D9488', tete: 'Candidat PPS Laâyoune', ordre: 6 },
        { code: 'UC', nom: 'Union Constitutionnelle', nom_ar: 'الاتحاد الدستوري', sigle_ar: 'دستوري', couleur: '#EA580C', tete: 'Candidat UC Laâyoune', ordre: 7 },
        { code: 'PJD', nom: 'Parti de la Justice et du Développement', nom_ar: 'حزب العدالة والتنمية', sigle_ar: 'عدالة وتنمية', couleur: '#15803D', tete: 'Candidat PJD Laâyoune', ordre: 8 },
        { code: 'FGD', nom: 'Fédération de la Gauche Démocratique', nom_ar: 'فيدرالية اليسار الديمقراطي', sigle_ar: 'يسار', couleur: '#B91C1C', tete: 'Candidat FGD Laâyoune', ordre: 9 },
        { code: 'MDS', nom: 'Mouvement Démocratique et Social', nom_ar: 'الحركة الديمقراطية والاجتماعية', sigle_ar: 'حركة ديمقراطية', couleur: '#854D0E', tete: 'Candidat MDS Laâyoune', ordre: 10 }
      ];

      for (const p of defaultPartis) {
        await runLocal(`INSERT INTO PARTIS_POLITIQUES (CODE, NOM_PARTI, NOM_ARABE, SIGLE_ARABE, COULEUR_HEX, TETE_LISTE, ORDRE_AFFICHAGE) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.code, p.nom, p.nom_ar, p.sigle_ar, p.couleur, p.tete, p.ordre]);
      }
    }
  } catch (e) {
    console.error('Erreur seed partis:', e);
  }

  // Seed default bureaux for Laâyoune
  try {
    const rowB = await getLocal(`SELECT COUNT(*) as count FROM BUREAUX_VOTE`);
    if (!rowB || rowB.count === 0) {
      const defaultBureaux = [
        { code: 'BV-LAY-001', commune: 'Laâyoune', centre: 'École Al Massira', num: 1, inscrits: 450 },
        { code: 'BV-LAY-002', commune: 'Laâyoune', centre: 'École Al Massira', num: 2, inscrits: 480 },
        { code: 'BV-LAY-003', commune: 'Laâyoune', centre: 'Collège Hassan II', num: 3, inscrits: 510 },
        { code: 'BV-LAY-004', commune: 'Laâyoune', centre: 'Collège Hassan II', num: 4, inscrits: 490 },
        { code: 'BV-LAY-005', commune: 'Laâyoune', centre: 'Lycée Ibn Zohr', num: 5, inscrits: 520 },
        { code: 'BV-LAY-006', commune: 'Laâyoune', centre: 'Lycée Ibn Zohr', num: 6, inscrits: 460 },
        { code: 'BV-LAY-007', commune: 'Laâyoune', centre: 'École Tarik Ibn Ziad', num: 7, inscrits: 470 },
        { code: 'BV-LAY-008', commune: 'Laâyoune', centre: 'École Tarik Ibn Ziad', num: 8, inscrits: 530 },
        { code: 'BV-LAY-009', commune: 'Laâyoune', centre: 'Collège Mohammed VI', num: 9, inscrits: 500 },
        { code: 'BV-LAY-010', commune: 'Laâyoune', centre: 'Collège Mohammed VI', num: 10, inscrits: 485 },
        { code: 'BV-MAR-001', commune: 'El Marsa', centre: 'École Primaire El Marsa', num: 1, inscrits: 420 },
        { code: 'BV-MAR-002', commune: 'El Marsa', centre: 'École Primaire El Marsa', num: 2, inscrits: 440 },
        { code: 'BV-MAR-003', commune: 'El Marsa', centre: 'Collège Al Port', num: 3, inscrits: 410 },
        { code: 'BV-BOU-001', commune: 'Boucraa', centre: 'Centre Communal Boucraa', num: 1, inscrits: 310 },
        { code: 'BV-BOU-002', commune: 'Boucraa', centre: 'Centre Communal Boucraa', num: 2, inscrits: 290 },
        { code: 'BV-DCH-001', commune: 'Dcheira', centre: 'Centre Communal Dcheira', num: 1, inscrits: 350 },
        { code: 'BV-DCH-002', commune: 'Dcheira', centre: 'Centre Communal Dcheira', num: 2, inscrits: 330 }
      ];

      for (const b of defaultBureaux) {
        await runLocal(`INSERT INTO BUREAUX_VOTE (CODE_BUREAU, COMMUNE, CENTRE_VOTE, NUMERO_BUREAU, NOMBRE_INSCRITS) VALUES (?, ?, ?, ?, ?)`,
          [b.code, b.commune, b.centre, b.num, b.inscrits]);
      }
    }
  } catch (e) {
    console.error('Erreur seed bureaux:', e);
  }

  await runLocal(`
    CREATE TABLE IF NOT EXISTS UTILISATEURS (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      USERNAME TEXT UNIQUE NOT NULL,
      PASSWORD TEXT NOT NULL,
      ROLE TEXT NOT NULL DEFAULT 'responsable',
      BUREAU_ID INTEGER,
      NOM_RESPONSABLE TEXT,
      TEL TEXT,
      CREATED_AT TEXT
    );
  `);

  // Seed default admin account
  try {
    const adminCheck = await getLocal(`SELECT COUNT(*) as count FROM UTILISATEURS WHERE ROLE='admin'`);
    if (!adminCheck || adminCheck.count === 0) {
      await runLocal(
        `INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, NOM_RESPONSABLE, CREATED_AT) VALUES (?, ?, 'admin', ?, ?)`,
        ['salama', 'electorale@1475963', 'Administrateur Principal', new Date().toISOString()]
      );
    }
  } catch (e) {}

  // Auto-generate accounts for all bureaux
  try {
    await generateAccountsForBureaux();
  } catch (e) {}
}

export async function getPartis() {
  await initDb();
  const rows = await queryLocal(`SELECT * FROM PARTIS_POLITIQUES ORDER BY ORDRE_AFFICHAGE ASC, ID ASC`);
  return rows.map(r => ({
    id: r.ID !== undefined ? r.ID : r.id,
    code: r.CODE || r.code,
    nom_parti: r.NOM_PARTI || r.nom_parti,
    nom_arabe: r.NOM_ARABE || r.nom_arabe || '',
    sigle_arabe: r.SIGLE_ARABE || r.sigle_arabe || '',
    couleur_hex: r.COULEUR_HEX || r.couleur_hex || '#3B82F6',
    tete_liste: r.TETE_LISTE || r.tete_liste || '',
    logo_icon: r.LOGO_ICON || r.logo_icon || 'Vote',
    ordre_affichage: r.ORDRE_AFFICHAGE || r.ordre_affichage || 0
  }));
}

export async function addParti({ code, nom_parti, nom_arabe = '', sigle_arabe = '', couleur_hex = '#3B82F6', tete_liste = '', logo_icon = 'Vote', ordre_affichage = 0 }) {
  await initDb();
  const res = await runLocal(
    `INSERT INTO PARTIS_POLITIQUES (CODE, NOM_PARTI, NOM_ARABE, SIGLE_ARABE, COULEUR_HEX, TETE_LISTE, LOGO_ICON, ORDRE_AFFICHAGE) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [code.trim().toUpperCase(), nom_parti.trim(), nom_arabe.trim(), sigle_arabe.trim(), couleur_hex.trim(), tete_liste.trim(), logo_icon.trim(), parseInt(ordre_affichage) || 0]
  );
  return { id: res.lastID, success: true };
}

export async function updateParti(id, { code, nom_parti, nom_arabe, sigle_arabe, couleur_hex, tete_liste, logo_icon, ordre_affichage }) {
  await initDb();
  await runLocal(
    `UPDATE PARTIS_POLITIQUES SET CODE=?, NOM_PARTI=?, NOM_ARABE=?, SIGLE_ARABE=?, COULEUR_HEX=?, TETE_LISTE=?, LOGO_ICON=?, ORDRE_AFFICHAGE=? WHERE ID=?`,
    [code.trim().toUpperCase(), nom_parti.trim(), (nom_arabe||'').trim(), (sigle_arabe||'').trim(), couleur_hex.trim(), (tete_liste||'').trim(), (logo_icon||'Vote').trim(), parseInt(ordre_affichage)||0, id]
  );
  return { success: true };
}

export async function deleteParti(id) {
  await initDb();
  await runLocal(`DELETE FROM VOTES_PARTIS WHERE PARTI_ID=?`, [id]);
  await runLocal(`DELETE FROM PARTIS_POLITIQUES WHERE ID=?`, [id]);
  return { success: true };
}

export async function getBureauxVote({ commune = '' } = {}) {
  await initDb();
  let sql = `
    SELECT b.*, 
           p.ID as pv_id, p.NOMBRE_VOTANTS, p.BULLETINS_NULS, p.BULLETINS_BLANCS, p.SUFFRAGES_EXPRIMES, p.EST_VALIDE, p.NOTE_ANOMALIE, p.UPDATED_AT
    FROM BUREAUX_VOTE b
    LEFT JOIN PV_BUREAUX p ON b.ID = p.BUREAU_ID
  `;
  const params = [];
  if (commune && commune !== 'ALL') {
    sql += ` WHERE LOWER(b.COMMUNE) = LOWER(?)`;
    params.push(commune);
  }
  sql += ` ORDER BY b.COMMUNE ASC, b.CENTRE_VOTE ASC, b.NUMERO_BUREAU ASC`;

  const rows = await queryLocal(sql, params);
  return rows.map(r => ({
    id: r.ID !== undefined ? r.ID : r.id,
    code_bureau: r.CODE_BUREAU || r.code_bureau,
    commune: r.COMMUNE || r.commune,
    centre_vote: r.CENTRE_VOTE || r.centre_vote,
    numero_bureau: r.NUMERO_BUREAU !== undefined ? r.NUMERO_BUREAU : r.numero_bureau,
    adresse: r.ADRESSE || r.adresse || '',
    nombre_inscrits: r.NOMBRE_INSCRITS !== undefined ? r.NOMBRE_INSCRITS : (r.nombre_inscrits || 0),
    has_pv: !!r.pv_id,
    pv: r.pv_id ? {
      id: r.pv_id,
      nombre_votants: r.NOMBRE_VOTANTS || 0,
      bulletins_nuls: r.BULLETINS_NULS || 0,
      bulletins_blancs: r.BULLETINS_BLANCS || 0,
      suffrages_exprimes: r.SUFFRAGES_EXPRIMES || 0,
      est_valide: r.EST_VALIDE === 1,
      note_anomalie: r.NOTE_ANOMALIE || '',
      updated_at: r.UPDATED_AT
    } : null
  }));
}

export async function addBureauVote({ code_bureau, commune, centre_vote, numero_bureau, adresse = '', nombre_inscrits = 0 }) {
  await initDb();
  const res = await runLocal(
    `INSERT INTO BUREAUX_VOTE (CODE_BUREAU, COMMUNE, CENTRE_VOTE, NUMERO_BUREAU, ADRESSE, NOMBRE_INSCRITS) VALUES (?, ?, ?, ?, ?, ?)`,
    [code_bureau.trim(), commune.trim(), centre_vote.trim(), parseInt(numero_bureau) || 1, adresse.trim(), parseInt(nombre_inscrits) || 0]
  );
  return { id: res.lastID, success: true };
}

export async function updateBureauVote(id, { code_bureau, commune, centre_vote, numero_bureau, adresse, nombre_inscrits }) {
  await initDb();
  await runLocal(
    `UPDATE BUREAUX_VOTE SET CODE_BUREAU=?, COMMUNE=?, CENTRE_VOTE=?, NUMERO_BUREAU=?, ADRESSE=?, NOMBRE_INSCRITS=? WHERE ID=?`,
    [code_bureau.trim(), commune.trim(), centre_vote.trim(), parseInt(numero_bureau) || 1, (adresse || '').trim(), parseInt(nombre_inscrits) || 0, id]
  );
  return { success: true };
}

export async function deleteBureauVote(id) {
  await initDb();
  const pv = await getLocal(`SELECT ID FROM PV_BUREAUX WHERE BUREAU_ID=?`, [id]);
  if (pv) {
    await runLocal(`DELETE FROM VOTES_PARTIS WHERE PV_ID=?`, [pv.ID]);
    await runLocal(`DELETE FROM PV_BUREAUX WHERE ID=?`, [pv.ID]);
  }
  await runLocal(`DELETE FROM BUREAUX_VOTE WHERE ID=?`, [id]);
  return { success: true };
}

export async function getPvResult(bureau_id) {
  await initDb();
  const bureau = await getLocal(`SELECT * FROM BUREAUX_VOTE WHERE ID=?`, [bureau_id]);
  if (!bureau) return null;

  const pv = await getLocal(`SELECT * FROM PV_BUREAUX WHERE BUREAU_ID=?`, [bureau_id]);
  let votesMap = {};

  if (pv) {
    const votesRows = await queryLocal(`SELECT PARTI_ID, NOMBRE_VOIX FROM VOTES_PARTIS WHERE PV_ID=?`, [pv.ID]);
    votesRows.forEach(v => {
      votesMap[v.PARTI_ID] = v.NOMBRE_VOIX;
    });
  }

  return {
    bureau: {
      id: bureau.ID,
      code_bureau: bureau.CODE_BUREAU,
      commune: bureau.COMMUNE,
      centre_vote: bureau.CENTRE_VOTE,
      numero_bureau: bureau.NUMERO_BUREAU,
      nombre_inscrits: bureau.NOMBRE_INSCRITS
    },
    pv: pv ? {
      id: pv.ID,
      nombre_votants: pv.NOMBRE_VOTANTS,
      bulletins_nuls: pv.BULLETINS_NULS,
      bulletins_blancs: pv.BULLETINS_BLANCS,
      suffrages_exprimes: pv.SUFFRAGES_EXPRIMES,
      est_valide: pv.EST_VALIDE === 1,
      note_anomalie: pv.NOTE_ANOMALIE,
      saisi_par: pv.SAISI_PAR,
      updated_at: pv.UPDATED_AT
    } : null,
    votes: votesMap
  };
}

export async function savePvResult({ bureau_id, votants = 0, nuls = 0, blancs = 0, exprimes = 0, votes_by_parti = {}, saisi_par = 'admin' }) {
  await initDb();

  const numVotants = parseInt(votants) || 0;
  const numNuls = parseInt(nuls) || 0;
  const numBlancs = parseInt(blancs) || 0;
  const numExprimes = parseInt(exprimes) || 0;

  const expectedExprimes = numVotants - (numNuls + numBlancs);
  let totalVotesPartis = 0;
  Object.values(votes_by_parti).forEach(v => {
    totalVotesPartis += (parseInt(v) || 0);
  });

  let anomalies = [];
  if (expectedExprimes !== numExprimes) {
    anomalies.push(`Incohérence: Suffrages Exprimés (${numExprimes}) != Votants (${numVotants}) - Nuls/Blancs (${numNuls + numBlancs})`);
  }
  if (totalVotesPartis !== numExprimes) {
    anomalies.push(`Incohérence: Somme des voix des partis (${totalVotesPartis}) != Suffrages Exprimés (${numExprimes})`);
  }

  const estValide = (anomalies.length === 0) ? 1 : 0;
  const noteAnomalie = anomalies.join(' | ');
  const nowStr = new Date().toISOString();

  let pv = await getLocal(`SELECT ID FROM PV_BUREAUX WHERE BUREAU_ID=?`, [bureau_id]);
  let pvId;

  if (pv) {
    pvId = pv.ID;
    await runLocal(
      `UPDATE PV_BUREAUX SET NOMBRE_VOTANTS=?, BULLETINS_NULS=?, BULLETINS_BLANCS=?, SUFFRAGES_EXPRIMES=?, EST_VALIDE=?, NOTE_ANOMALIE=?, SAISI_PAR=?, UPDATED_AT=? WHERE ID=?`,
      [numVotants, numNuls, numBlancs, numExprimes, estValide, noteAnomalie, saisi_par, nowStr, pvId]
    );
  } else {
    const res = await runLocal(
      `INSERT INTO PV_BUREAUX (BUREAU_ID, NOMBRE_VOTANTS, BULLETINS_NULS, BULLETINS_BLANCS, SUFFRAGES_EXPRIMES, EST_VALIDE, NOTE_ANOMALIE, SAISI_PAR, CREATED_AT, UPDATED_AT) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bureau_id, numVotants, numNuls, numBlancs, numExprimes, estValide, noteAnomalie, saisi_par, nowStr, nowStr]
    );
    pvId = res.lastID;
  }

  for (const [partiIdStr, countVal] of Object.entries(votes_by_parti)) {
    const partiId = parseInt(partiIdStr);
    if (isNaN(partiId)) continue;
    const count = parseInt(countVal) || 0;
    await runLocal(
      `INSERT INTO VOTES_PARTIS (PV_ID, PARTI_ID, NOMBRE_VOIX) VALUES (?, ?, ?) ON CONFLICT(PV_ID, PARTI_ID) DO UPDATE SET NOMBRE_VOIX=excluded.NOMBRE_VOIX`,
      [pvId, partiId, count]
    );
  }

  return { success: true, pv_id: pvId, est_valide: estValide === 1, note_anomalie: noteAnomalie };
}

export async function getVotesAggregation({ commune = '' } = {}) {
  await initDb();

  const partis = await getPartis();

  let bureauxSql = `SELECT b.ID, b.NOMBRE_INSCRITS, p.ID as pv_id, p.NOMBRE_VOTANTS, p.BULLETINS_NULS, p.BULLETINS_BLANCS, p.SUFFRAGES_EXPRIMES, p.EST_VALIDE FROM BUREAUX_VOTE b LEFT JOIN PV_BUREAUX p ON b.ID = p.BUREAU_ID`;
  const params = [];
  if (commune && commune !== 'ALL') {
    bureauxSql += ` WHERE LOWER(b.COMMUNE) = LOWER(?)`;
    params.push(commune);
  }

  const bureauxRows = await queryLocal(bureauxSql, params);

  const totalBureaux = bureauxRows.length;
  let depouillesCount = 0;
  let invalidesCount = 0;
  let totalInscrits = 0;
  let totalVotants = 0;
  let totalNulsBlancs = 0;
  let totalExprimes = 0;

  const validPvIds = [];

  bureauxRows.forEach(b => {
    totalInscrits += (b.NOMBRE_INSCRITS || 0);
    if (b.pv_id) {
      depouillesCount++;
      if (b.EST_VALIDE === 0) invalidesCount++;
      totalVotants += (b.NOMBRE_VOTANTS || 0);
      totalNulsBlancs += ((b.BULLETINS_NULS || 0) + (b.BULLETINS_BLANCS || 0));
      totalExprimes += (b.SUFFRAGES_EXPRIMES || 0);
      validPvIds.push(b.pv_id);
    }
  });

  const tauxDepouillement = totalBureaux > 0 ? parseFloat(((depouillesCount / totalBureaux) * 100).toFixed(2)) : 0;
  const tauxParticipation = totalInscrits > 0 ? parseFloat(((totalVotants / totalInscrits) * 100).toFixed(2)) : 0;

  let votesByPartyMap = {};
  partis.forEach(p => {
    votesByPartyMap[p.id] = 0;
  });

  if (validPvIds.length > 0) {
    const placeholders = validPvIds.map(() => '?').join(',');
    const votesRows = await queryLocal(
      `SELECT PARTI_ID, SUM(NOMBRE_VOIX) as total_voix FROM VOTES_PARTIS WHERE PV_ID IN (${placeholders}) GROUP BY PARTI_ID`,
      validPvIds
    );
    votesRows.forEach(v => {
      votesByPartyMap[v.PARTI_ID] = v.total_voix || 0;
    });
  }

  let resultsByParty = partis.map(p => {
    const totalVoix = votesByPartyMap[p.id] || 0;
    const pct = totalExprimes > 0 ? parseFloat(((totalVoix / totalExprimes) * 100).toFixed(2)) : 0;
    return {
      id: p.id,
      code: p.code,
      nom_parti: p.nom_parti,
      nom_arabe: p.nom_arabe,
      sigle_arabe: p.sigle_arabe,
      couleur_hex: p.couleur_hex,
      tete_liste: p.tete_liste,
      logo_icon: p.logo_icon,
      total_voix: totalVoix,
      pourcentage: pct,
      sieges: 0
    };
  });

  resultsByParty.sort((a, b) => b.total_voix - a.total_voix);

  resultsByParty.forEach((item, index) => {
    item.rang = index + 1;
  });

  const NOMBRE_SIEGES = 3;
  if (totalExprimes > 0 && resultsByParty.length > 0) {
    const quotient = totalExprimes / NOMBRE_SIEGES;
    let siegesAttribues = 0;
    let tempResults = resultsByParty.map(r => ({ ...r, sieges: 0, reste: r.total_voix }));

    tempResults.forEach(r => {
      if (quotient > 0) {
        const s = Math.floor(r.total_voix / quotient);
        r.sieges = s;
        siegesAttribues += s;
        r.reste = r.total_voix - (s * quotient);
      }
    });

    while (siegesAttribues < NOMBRE_SIEGES) {
      let maxMoyenne = -1;
      let winningIndex = -1;

      tempResults.forEach((r, idx) => {
        const moyenne = r.total_voix / (r.sieges + 1);
        if (moyenne > maxMoyenne) {
          maxMoyenne = moyenne;
          winningIndex = idx;
        }
      });

      if (winningIndex >= 0 && maxMoyenne > 0) {
        tempResults[winningIndex].sieges += 1;
        siegesAttribues++;
      } else {
        break;
      }
    }

    resultsByParty.forEach(r => {
      const match = tempResults.find(t => t.id === r.id);
      if (match) r.sieges = match.sieges;
    });
  }

  return {
    commune: commune || 'ALL',
    total_bureaux: totalBureaux,
    depouilles_count: depouillesCount,
    invalides_count: invalidesCount,
    taux_depouillement: tauxDepouillement,
    total_inscrits: totalInscrits,
    total_votants: totalVotants,
    total_nuls_blancs: totalNulsBlancs,
    total_exprimes: totalExprimes,
    taux_participation: tauxParticipation,
    results_by_party: resultsByParty
  };
}

// ----------------------------------------------------
// AUTHENTICATION & USERS MANAGEMENT MODULE
// ----------------------------------------------------

export async function loginUser(username, password) {
  await initDb();
  const cleanUser = (username || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  // Built-in Admin fallback
  if ((cleanUser === 'salama' || cleanUser === 'admin') && (cleanPass === 'electorale@1475963' || cleanPass === 'admin123' || cleanPass === 'admin')) {
    return {
      id: 0,
      username: 'salama',
      role: 'admin',
      bureau_id: null,
      nom_responsable: 'Administrateur Principal (salama)',
      bureau_details: null
    };
  }

  const row = await getLocal(`SELECT * FROM UTILISATEURS WHERE LOWER(USERNAME) = ?`, [cleanUser]);
  if (!row) return null;

  if (row.PASSWORD === cleanPass || row.password === cleanPass) {
    let bureauDetails = null;
    const bureauId = row.BUREAU_ID || row.bureau_id;
    if (bureauId) {
      const b = await getLocal(`SELECT * FROM BUREAUX_VOTE WHERE ID=?`, [bureauId]);
      if (b) {
        bureauDetails = {
          id: b.ID,
          code_bureau: b.CODE_BUREAU,
          commune: b.COMMUNE,
          centre_vote: b.CENTRE_VOTE,
          numero_bureau: b.NUMERO_BUREAU,
          nombre_inscrits: b.NOMBRE_INSCRITS
        };
      }
    }

    return {
      id: row.ID || row.id,
      username: row.USERNAME || row.username,
      role: row.ROLE || row.role || 'responsable',
      bureau_id: bureauId || null,
      nom_responsable: row.NOM_RESPONSABLE || row.nom_responsable || row.USERNAME,
      tel: row.TEL || row.tel || '',
      bureau_details: bureauDetails
    };
  }

  return null;
}

export async function getUsers() {
  await initDb();
  const rows = await queryLocal(`
    SELECT u.*, b.CODE_BUREAU, b.COMMUNE, b.CENTRE_VOTE, b.NUMERO_BUREAU
    FROM UTILISATEURS u
    LEFT JOIN BUREAUX_VOTE b ON u.BUREAU_ID = b.ID
    ORDER BY u.ROLE ASC, b.COMMUNE ASC, b.NUMERO_BUREAU ASC
  `);

  return rows.map(r => ({
    id: r.ID || r.id,
    username: r.USERNAME || r.username,
    password: r.PASSWORD || r.password,
    role: r.ROLE || r.role || 'responsable',
    bureau_id: r.BUREAU_ID || r.bureau_id || null,
    nom_responsable: r.NOM_RESPONSABLE || r.nom_responsable || '',
    tel: r.TEL || r.tel || '',
    created_at: r.CREATED_AT || r.created_at,
    code_bureau: r.CODE_BUREAU || '',
    commune: r.COMMUNE || '',
    centre_vote: r.CENTRE_VOTE || '',
    numero_bureau: r.NUMERO_BUREAU || null
  }));
}

export async function addUser({ username, password, role = 'responsable', bureau_id = null, nom_responsable = '', tel = '' }) {
  await initDb();
  const cleanUser = username.trim().toLowerCase();
  const res = await runLocal(
    `INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, BUREAU_ID, NOM_RESPONSABLE, TEL, CREATED_AT) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cleanUser, password.trim(), role, bureau_id ? parseInt(bureau_id) : null, nom_responsable.trim(), tel.trim(), new Date().toISOString()]
  );
  return { id: res.lastID, success: true };
}

export async function updateUser(id, { username, password, role, bureau_id, nom_responsable, tel }) {
  await initDb();
  await runLocal(
    `UPDATE UTILISATEURS SET USERNAME=?, PASSWORD=?, ROLE=?, BUREAU_ID=?, NOM_RESPONSABLE=?, TEL=? WHERE ID=?`,
    [username.trim().toLowerCase(), password.trim(), role, bureau_id ? parseInt(bureau_id) : null, (nom_responsable || '').trim(), (tel || '').trim(), id]
  );
  return { success: true };
}

export async function deleteUser(id) {
  await initDb();
  await runLocal(`DELETE FROM UTILISATEURS WHERE ID=?`, [id]);
  return { success: true };
}

export async function generateAccountsForBureaux() {
  await initDb();
  const bureaux = await queryLocal(`SELECT * FROM BUREAUX_VOTE`);
  let createdCount = 0;

  for (const b of bureaux) {
    const existing = await getLocal(`SELECT ID FROM UTILISATEURS WHERE BUREAU_ID=?`, [b.ID]);
    if (!existing) {
      const cleanCode = (b.CODE_BUREAU || `bv_${b.ID}`).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const defaultPass = `pass${b.NUMERO_BUREAU || b.ID}2026`;
      await runLocal(
        `INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, BUREAU_ID, NOM_RESPONSABLE, CREATED_AT) VALUES (?, ?, 'responsable', ?, ?, ?)`,
        [cleanCode, defaultPass, b.ID, `Responsable ${b.CENTRE_VOTE} BV ${b.NUMERO_BUREAU}`, new Date().toISOString()]
      );
      createdCount++;
    }
  }

  return { success: true, createdCount };
}

