import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;

if (!url || !key) {
  console.log('⚠️ Veuillez d\'abord définir SUPABASE_URL et SUPABASE_KEY dans votre fichier .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
  console.log('⚡ Connexion à Supabase Cloud...');
  const { data: partis, error } = await supabase.from('partis_politiques').select('*');
  if (error) {
    console.error('❌ Erreur de connexion Supabase:', error.message);
  } else {
    console.log('✅ Connexion Supabase réussie ! Partis enregistrés dans le Cloud :', partis.length);
  }
}

testConnection();
