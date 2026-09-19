import { supabase } from './supabase_db.js';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'depouillement_laayoune.db');

async function setPiFirst() {
  console.log('=== METTRE LE PARTI DE L\'ISTIQLAL (PI) EN POSITION 1 EN BASE ===');

  // Supabase Cloud
  await supabase.from('partis_politiques').update({ ordre_affichage: 1 }).eq('code', 'PI');
  await supabase.from('partis_politiques').update({ ordre_affichage: 2 }).eq('code', 'RNI');
  await supabase.from('partis_politiques').update({ ordre_affichage: 3 }).eq('code', 'PAM');

  const { data: partisS } = await supabase.from('partis_politiques').select('code, nom_arabe, ordre_affichage').order('ordre_affichage');
  console.log('Supabase Cloud Partis Ordre:', partisS);

  // SQLite Local
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {
    db.run("UPDATE PARTIS_POLITIQUES SET ORDRE_AFFICHAGE = 1 WHERE CODE = 'PI'");
    db.run("UPDATE PARTIS_POLITIQUES SET ORDRE_AFFICHAGE = 2 WHERE CODE = 'RNI'");
    db.run("UPDATE PARTIS_POLITIQUES SET ORDRE_AFFICHAGE = 3 WHERE CODE = 'PAM'");
    db.all('SELECT CODE, NOM_PARTI, ORDRE_AFFICHAGE FROM PARTIS_POLITIQUES ORDER BY ORDRE_AFFICHAGE', (err, rows) => {
      console.log('SQLite Local Partis Ordre:', rows);
    });
  });
  db.close();
}

setPiFirst();
