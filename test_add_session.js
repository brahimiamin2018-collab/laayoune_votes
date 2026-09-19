import { addUser, getUsers, loginUser, deleteUser } from './database.js';
import { supabase } from './supabase_db.js';

async function verifyAddSession() {
  console.log('🧪 VÉRIFICATION DE L\'AJOUT D\'UNE NOUVELLE SESSION RESPONSABLE...');

  const testUser = {
    username: 'bv_test_999',
    password: 'passTest2026',
    role: 'responsable',
    bureau_id: 1,
    nom_responsable: 'Responsable Test École Al Massira BV 1',
    tel: '0661000000'
  };

  // 1. Add via SQLite
  const resLocal = await addUser(testUser);
  console.log('✅ SQLite : Nouveau compte responsable créé avec ID =', resLocal.id);

  // 2. Add via Supabase Cloud
  if (supabase) {
    const { data, error } = await supabase.from('utilisateurs').insert({
      username: testUser.username,
      password: testUser.password,
      role: testUser.role,
      bureau_id: testUser.bureau_id,
      nom_responsable: testUser.nom_responsable,
      tel: testUser.tel
    }).select().single();

    if (error) console.error('Erreur Supabase add user:', error.message);
    else console.log('✅ Supabase Cloud DB : Compte responsable créé avec succès dans le Cloud !');
  }

  // 3. Test Login with new session
  const session = await loginUser(testUser.username, testUser.password);
  if (session && session.username === testUser.username) {
    console.log('🎉 TEST CONNEXION RÉUSSI ! La nouvelle session fonctionne :', session);
  } else {
    console.error('❌ Échec de connexion avec la nouvelle session !');
  }

  // Cleanup test user
  await deleteUser(resLocal.id);
  if (supabase) {
    await supabase.from('utilisateurs').delete().eq('username', testUser.username);
  }
  console.log('🧹 Compte de test supprimé proprement.');
}

verifyAddSession();
