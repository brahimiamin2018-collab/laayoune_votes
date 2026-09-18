import { getBureauxVote, getUsers } from './database.js';

async function dump() {
  const bureaux = await getBureauxVote();
  console.log('=== BUREAUX_VOTE ===');
  bureaux.forEach(b => console.log(`ID: ${b.id}, CODE: ${b.code_bureau}, COMMUNE: ${b.commune}, CENTRE: ${b.centre_vote}, NUM: ${b.numero_bureau}`));

  const users = await getUsers();
  console.log('=== UTILISATEURS ===');
  users.forEach(u => console.log(`ID: ${u.id}, USERNAME: ${u.username}, ROLE: ${u.role}, BUREAU_ID: ${u.bureau_id}, CODE_BUREAU: ${u.code_bureau}, CENTRE: ${u.centre_vote}, NUM: ${u.numero_bureau}`));
}

dump();
