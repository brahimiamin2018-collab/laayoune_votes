import { getUsers, getBureauxVote } from './database.js';

async function check() {
  const bureaux = await getBureauxVote();
  console.log('--- BUREAUX DE VOTE ---');
  console.log(bureaux.slice(0, 5));

  const users = await getUsers();
  console.log('--- UTILISATEURS ---');
  users.forEach(u => console.log(`ID: ${u.id}, Username: ${u.username}, Pass: ${u.password}, BureauID: ${u.bureau_id}, Code: ${u.code_bureau}, Centre: ${u.centre_vote}, Num: ${u.numero_bureau}`));
}

check();
