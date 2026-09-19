import { getUsers, deleteUser } from './database.js';
import { supabase } from './supabase_db.js';

async function cleanup() {
  console.log('🧹 Nettoyage des comptes utilisateurs (conservation de l\'administrateur salama uniquement)...');

  // 1. Local SQLite
  try {
    const users = await getUsers();
    let count = 0;
    for (const u of users) {
      if (u.username !== 'salama' && u.role !== 'admin') {
        await deleteUser(u.id);
        count++;
      }
    }
    console.log(`✅ SQLite : ${count} comptes responsables supprimés.`);
  } catch (e) {
    console.error('Erreur SQLite cleanup:', e);
  }

  // 2. Supabase Cloud DB
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .delete()
        .neq('username', 'salama');

      if (error) console.error('Erreur Supabase cleanup:', error.message);
      else console.log('✅ Supabase Cloud DB : Tous les comptes hors salama supprimés !');
    } catch (e) {
      console.error('Erreur Supabase:', e);
    }
  }

  console.log('✨ Seul le compte Administrateur Principal (salama) est conservé !');
}

cleanup();
