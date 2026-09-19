import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function seed() {
  console.log('🌱 Nettoyage et Alimentation de la base de données Cloud Supabase pour Tan-Tan 2026...');

  // 1. Clear old PVs, votes, and bureaux to remove Laâyoune data from Cloud Supabase
  try {
    await supabase.from('votes_partis').delete().neq('id', 0);
    await supabase.from('pv_bureaux').delete().neq('id', 0);
    await supabase.from('utilisateurs').delete().neq('username', 'salama');
    await supabase.from('bureaux_vote').delete().neq('id', 0);
    console.log('🧹 Ancien contenu de Laâyoune purgé de Supabase Cloud.');
  } catch (e) {
    console.warn('Note sur nettoyage Supabase:', e.message);
  }

  // 2. Seed Tan-Tan Partis
  const defaultPartis = [
    { code: 'RNI', nom_parti: 'Rassemblement National des Indépendants', nom_arabe: 'التجمع الوطني للأحرار', sigle_arabe: 'أحرار', couleur_hex: '#0066B3', tete_liste: 'Candidat RNI Tan-Tan', ordre_affichage: 1 },
    { code: 'PAM', nom_parti: 'Parti Authenticité et Modernité', nom_arabe: 'حزب الأصالة والمعاصرة', sigle_arabe: 'أصالة', couleur_hex: '#008080', tete_liste: 'Candidat PAM Tan-Tan', ordre_affichage: 2 },
    { code: 'PI', nom_parti: 'Parti de l\'Istiqlal', nom_arabe: 'حزب الاستقلال', sigle_arabe: 'استقلال', couleur_hex: '#1E3A8A', tete_liste: 'Candidat PI Tan-Tan', ordre_affichage: 3 },
    { code: 'USFP', nom_parti: 'Union Socialiste des Forces Populaires', nom_arabe: 'الاتحاد الاشتراكي للقوات الشعبية', sigle_arabe: 'اتحاد اشتراكي', couleur_hex: '#DC2626', tete_liste: 'Candidat USFP Tan-Tan', ordre_affichage: 4 },
    { code: 'MP', nom_parti: 'Mouvement Populaire', nom_arabe: 'الحركة الشعبية', sigle_arabe: 'حركة', couleur_hex: '#16A34A', tete_liste: 'Candidat MP Tan-Tan', ordre_affichage: 5 },
    { code: 'PPS', nom_parti: 'Parti du Progrès et du Socialisme', nom_arabe: 'حزب التقدم والاشتراكية', sigle_arabe: 'تقدم', couleur_hex: '#0D9488', tete_liste: 'Candidat PPS Tan-Tan', ordre_affichage: 6 },
    { code: 'UC', nom_parti: 'Union Constitutionnelle', nom_arabe: 'الاتحاد الدستوري', sigle_arabe: 'دستوري', couleur_hex: '#EA580C', tete_liste: 'Candidat UC Tan-Tan', ordre_affichage: 7 },
    { code: 'PJD', nom_parti: 'Parti de la Justice et du Développement', nom_arabe: 'حزب العدالة والتنمية', sigle_arabe: 'عدالة وتنمية', couleur_hex: '#15803D', tete_liste: 'Candidat PJD Tan-Tan', ordre_affichage: 8 },
    { code: 'FGD', nom_parti: 'Fédération de la Gauche Démocratique', nom_arabe: 'فيدرالية اليسار الديمقراطي', sigle_arabe: 'يسار', couleur_hex: '#B91C1C', tete_liste: 'Candidat FGD Tan-Tan', ordre_affichage: 9 },
    { code: 'MDS', nom_parti: 'Mouvement Démocratique et Social', nom_arabe: 'الحركة الديمقراطية والاجتماعية', sigle_arabe: 'حركة ديمقراطية', couleur_hex: '#854D0E', tete_liste: 'Candidat MDS Tan-Tan', ordre_affichage: 10 }
  ];

  const { data: insertedPartis, error: errP } = await supabase.from('partis_politiques').upsert(defaultPartis, { onConflict: 'code' }).select();
  if (errP) console.error('Erreur partis:', errP.message);
  else console.log(`✅ ${insertedPartis.length} partis politiques configurés dans le Cloud.`);

  // 3. Seed Tan-Tan Bureaux
  const defaultBureaux = [
    { code_bureau: 'BV-TAN-001', commune: 'Tan-Tan', centre_vote: 'École Al Massira', numero_bureau: 1, nombre_inscrits: 450 },
    { code_bureau: 'BV-TAN-002', commune: 'Tan-Tan', centre_vote: 'École Al Massira', numero_bureau: 2, nombre_inscrits: 480 },
    { code_bureau: 'BV-TAN-003', commune: 'Tan-Tan', centre_vote: 'Collège Hassan II', numero_bureau: 3, nombre_inscrits: 510 },
    { code_bureau: 'BV-TAN-004', commune: 'Tan-Tan', centre_vote: 'Collège Hassan II', numero_bureau: 4, nombre_inscrits: 490 },
    { code_bureau: 'BV-TAN-005', commune: 'Tan-Tan', centre_vote: 'Lycée Ibn Zohr', numero_bureau: 5, nombre_inscrits: 520 },
    { code_bureau: 'BV-TAN-006', commune: 'Tan-Tan', centre_vote: 'Lycée Ibn Zohr', numero_bureau: 6, nombre_inscrits: 460 },
    { code_bureau: 'BV-TAN-007', commune: 'Tan-Tan', centre_vote: 'École Tarik Ibn Ziad', numero_bureau: 7, nombre_inscrits: 470 },
    { code_bureau: 'BV-TAN-008', commune: 'Tan-Tan', centre_vote: 'École Tarik Ibn Ziad', numero_bureau: 8, nombre_inscrits: 530 },
    { code_bureau: 'BV-OUA-001', commune: 'El Ouatia', centre_vote: 'École Primaire El Ouatia', numero_bureau: 1, nombre_inscrits: 420 },
    { code_bureau: 'BV-OUA-002', commune: 'El Ouatia', centre_vote: 'École Primaire El Ouatia', numero_bureau: 2, nombre_inscrits: 440 },
    { code_bureau: 'BV-ABT-001', commune: 'Abteh', centre_vote: 'Centre Communal Abteh', numero_bureau: 1, nombre_inscrits: 350 },
    { code_bureau: 'BV-KHL-001', commune: 'Ben Khlil', centre_vote: 'Centre Communal Ben Khlil', numero_bureau: 1, nombre_inscrits: 310 },
    { code_bureau: 'BV-CHB-001', commune: 'Chbika', centre_vote: 'Centre Communal Chbika', numero_bureau: 1, nombre_inscrits: 290 },
    { code_bureau: 'BV-MSI-001', commune: 'Msied', centre_vote: 'Centre Communal Msied', numero_bureau: 1, nombre_inscrits: 330 },
    { code_bureau: 'BV-TIL-001', commune: 'Tilemzoune', centre_vote: 'Centre Communal Tilemzoune', numero_bureau: 1, nombre_inscrits: 320 }
  ];

  const { data: insertedBureaux, error: errB } = await supabase.from('bureaux_vote').upsert(defaultBureaux, { onConflict: 'code_bureau' }).select();
  if (errB) console.error('Erreur bureaux:', errB.message);
  else console.log(`✅ ${insertedBureaux.length} bureaux de vote Tan-Tan créés dans le Cloud.`);

  // 4. Seed Accounts
  if (insertedBureaux) {
    const usersToCreate = insertedBureaux.map(b => ({
      username: b.code_bureau.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      password: `pass${b.numero_bureau}2026`,
      role: 'responsable',
      bureau_id: b.id,
      nom_responsable: `Responsable ${b.centre_vote} BV ${b.numero_bureau}`
    }));

    usersToCreate.push({
      username: 'salama',
      password: 'electorale@1475963',
      role: 'admin',
      bureau_id: null,
      nom_responsable: 'Administrateur Principal (salama)'
    });

    const { error: errU } = await supabase.from('utilisateurs').upsert(usersToCreate, { onConflict: 'username' });
    if (errU) console.error('Erreur utilisateurs:', errU.message);
    else console.log(`✅ ${usersToCreate.length} comptes d'accès Tan-Tan créés dans Cloud Supabase.`);
  }

  console.log('🚀 BASE DE DONNÉES CLOUD SUPABASE ALIMENTÉE POUR TAN-TAN AVEC SUCCÈS !');
}

seed();
