import { createClient } from '@supabase/supabase-js';
import sqlite3Module from 'sqlite3';
import openpyxl from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "https://zkpmkdqqbqwayescbzns.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY || "sb_publishable_kC-Eo4QnS1fveDhOutUcLA_uC5Wx3in";

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const COMMUNE_MAP = {
  'طانطان': { name: 'Tan-Tan', code: 'TAN' },
  'الوطية': { name: 'El Ouatia', code: 'OUA' },
  'ابن خليل': { name: 'Ben Khlil', code: 'KHL' },
  'أبطيح': { name: 'Abteh', code: 'ABT' },
  'الشبيكة': { name: 'Chbika', code: 'CHB' },
  'تيلمزون': { name: 'Tilemzoune', code: 'TIL' },
  'المسيد': { name: 'Msied', code: 'MSI' }
};

function generatePassword() {
  const prefixes = ['tan', 'bv', 'pass', 'v'];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${p}${num}`;
}

async function runImport() {
  console.log("🚀 Extration des 174 bureaux et génération des comptes...");

  const rawJson = execSync(`python parse_excel.py`, { encoding: 'utf-8' });
  const excelData = JSON.parse(rawJson);

  console.log(`✅ ${excelData.length} bureaux extraits de l'Excel.`);

  const bureauxList = [];
  const usersList = [];
  const communeCounts = {};

  for (const item of excelData) {
    const numBv = item.num;
    const communeAr = item.commune_ar;
    const cInfo = COMMUNE_MAP[communeAr] || { name: communeAr, code: 'GEN' };
    const communeFr = cInfo.name;
    const codePrefix = cInfo.code;

    communeCounts[communeFr] = (communeCounts[communeFr] || 0) + 1;

    const numStr = String(numBv).padStart(3, '0');
    const codeBureau = `BV-${codePrefix}-${numStr}`;
    const username = `bv_${codePrefix.toLowerCase()}_${numStr}`;
    const password = generatePassword();
    const centreVote = `Centre de Vote ${communeFr}`;
    const nombreInscrits = Math.floor(380 + Math.random() * 150);

    bureauxList.append ? null : null;
    bureauxList.push({
      code_bureau: codeBureau,
      commune: communeFr,
      centre_vote: centreVote,
      numero_bureau: numBv,
      nombre_inscrits: nombreInscrits
    });

    usersList.push({
      username: username,
      password: password,
      role: 'responsable',
      code_bureau: codeBureau,
      commune: communeFr,
      numero_bureau: numBv,
      nom_responsable: `Représentant BV N°${numBv} (${communeFr})`
    });
  }

  // 1. Update SQLite Local DB
  const sqlite3 = sqlite3Module.default || sqlite3Module;
  const dbPath = path.join(__dirname, 'depouillement_laayoune.db');

  const db = new sqlite3.Database(dbPath);

  const runSql = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

  const getSql = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  await runSql("DELETE FROM VOTES_PARTIS");
  await runSql("DELETE FROM PV_BUREAUX");
  await runSql("DELETE FROM UTILISATEURS WHERE ROLE != 'admin'");
  await runSql("DELETE FROM BUREAUX_VOTE");

  // Ensure Admin accounts exist
  const adminCheck = await getSql("SELECT COUNT(*) as count FROM UTILISATEURS WHERE USERNAME='salama'");
  if (!adminCheck || adminCheck.count === 0) {
    await runSql("INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, NOM_RESPONSABLE, CREATED_AT) VALUES (?, ?, 'admin', ?, ?)",
      ['salama', 'electorale@1475963', 'Administrateur Principal', new Date().toISOString()]);
  }
  const adminCheck2 = await getSql("SELECT COUNT(*) as count FROM UTILISATEURS WHERE USERNAME='admin'");
  if (!adminCheck2 || adminCheck2.count === 0) {
    await runSql("INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, NOM_RESPONSABLE, CREATED_AT) VALUES (?, ?, 'admin', ?, ?)",
      ['admin', 'electorale@1475963', 'Administrateur Central', new Date().toISOString()]);
  }

  const bureauIdMap = {};
  for (const b of bureauxList) {
    const res = await runSql(
      "INSERT INTO BUREAUX_VOTE (CODE_BUREAU, COMMUNE, CENTRE_VOTE, NUMERO_BUREAU, NOMBRE_INSCRITS) VALUES (?, ?, ?, ?, ?)",
      [b.code_bureau, b.commune, b.centre_vote, b.numero_bureau, b.nombre_inscrits]
    );
    bureauIdMap[b.code_bureau] = res.lastID;
  }

  for (const u of usersList) {
    const bId = bureauIdMap[u.code_bureau];
    await runSql(
      "INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, BUREAU_ID, NOM_RESPONSABLE, CREATED_AT) VALUES (?, ?, 'responsable', ?, ?, ?)",
      [u.username, u.password, bId, u.nom_responsable, new Date().toISOString()]
    );
  }

  console.log(`✅ Base SQLite locale mise à jour avec ${bureauxList.length} bureaux et ${usersList.length} responsables.`);

  // 2. Sync to Supabase Cloud
  if (supabase) {
    try {
      console.log("⚡ Synchronisation avec Supabase Cloud...");
      await supabase.from('votes_partis').delete().neq('id', 0);
      await supabase.from('pv_bureaux').delete().neq('id', 0);
      await supabase.from('utilisateurs').delete().neq('role', 'admin');
      await supabase.from('bureaux_vote').delete().neq('id', 0);

      // Upsert admins
      await supabase.from('utilisateurs').upsert([
        { username: 'salama', password: 'electorale@1475963', role: 'admin', nom_responsable: 'Administrateur Principal' },
        { username: 'admin', password: 'electorale@1475963', role: 'admin', nom_responsable: 'Administrateur Central' }
      ], { onConflict: 'username' });

      // Upsert Bureaux
      const { data: insertedBureaux, error: errB } = await supabase
        .from('bureaux_vote')
        .upsert(bureauxList, { onConflict: 'code_bureau' })
        .select();

      if (errB) console.error("Erreur insertion bureaux Supabase:", errB.message);
      else {
        const sbBureauMap = {};
        insertedBureaux.forEach(b => { sbBureauMap[b.code_bureau] = b.id; });

        const sbUsers = usersList.map(u => ({
          username: u.username,
          password: u.password,
          role: 'responsable',
          bureau_id: sbBureauMap[u.code_bureau] || null,
          nom_responsable: u.nom_responsable
        }));

        // Batch insert in chunks of 50
        for (let i = 0; i < sbUsers.length; i += 50) {
          const chunk = sbUsers.slice(i, i + 50);
          await supabase.from('utilisateurs').upsert(chunk, { onConflict: 'username' });
        }

        console.log(`⚡ ${sbUsers.length} comptes de responsables synchronisés dans Supabase Cloud !`);
      }

    } catch (errCloud) {
      console.error("Avertissement synchro Supabase:", errCloud.message);
    }
  }

  // Save JSON summary
  const summaryPath = path.join(__dirname, 'representants_174_tantan.json');
  fs.writeFileSync(summaryPath, JSON.stringify(usersList, null, 2), 'utf-8');
  console.log(`📄 Liste complète sauvegardée dans ${summaryPath}`);

  db.close();
}

runImport().catch(console.error);
