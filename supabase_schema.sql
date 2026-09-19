-- ========================================================
-- SCHEMA CLOUD SUPABASE POSTGRESQL (LAAYOUNE 2026)
-- Copiez-collez l'intégralité de ce script dans SQL Editor
-- ========================================================

-- 1. Table PARTIS_POLITIQUES
CREATE TABLE IF NOT EXISTS partis_politiques (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  nom_parti VARCHAR(255) NOT NULL,
  nom_arabe VARCHAR(255),
  sigle_arabe VARCHAR(100),
  couleur_hex VARCHAR(20) NOT NULL DEFAULT '#0066B3',
  tete_liste VARCHAR(255),
  logo_icon VARCHAR(50) DEFAULT 'Vote',
  ordre_affichage INT DEFAULT 0
);

-- 2. Table BUREAUX_VOTE
CREATE TABLE IF NOT EXISTS bureaux_vote (
  id SERIAL PRIMARY KEY,
  code_bureau VARCHAR(50) UNIQUE NOT NULL,
  commune VARCHAR(100) NOT NULL,
  centre_vote VARCHAR(255) NOT NULL,
  numero_bureau INT NOT NULL,
  adresse TEXT,
  nombre_inscrits INT DEFAULT 0
);

-- 3. Table PV_BUREAUX
CREATE TABLE IF NOT EXISTS pv_bureaux (
  id SERIAL PRIMARY KEY,
  bureau_id INT UNIQUE NOT NULL REFERENCES bureaux_vote(id) ON DELETE CASCADE,
  nombre_votants INT DEFAULT 0,
  bulletins_nuls INT DEFAULT 0,
  bulletins_blancs INT DEFAULT 0,
  suffrages_exprimes INT DEFAULT 0,
  est_valide BOOLEAN DEFAULT FALSE,
  note_anomalie TEXT,
  saisi_par VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table VOTES_PARTIS
CREATE TABLE IF NOT EXISTS votes_partis (
  id SERIAL PRIMARY KEY,
  pv_id INT NOT NULL REFERENCES pv_bureaux(id) ON DELETE CASCADE,
  parti_id INT NOT NULL REFERENCES partis_politiques(id) ON DELETE CASCADE,
  nombre_voix INT DEFAULT 0,
  CONSTRAINT unique_pv_parti UNIQUE(pv_id, parti_id)
);

-- 5. Table UTILISATEURS
CREATE TABLE IF NOT EXISTS utilisateurs (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'responsable',
  bureau_id INT REFERENCES bureaux_vote(id) ON DELETE SET NULL,
  nom_responsable VARCHAR(255),
  tel VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Alias majuscules pour compatibilité totale (Vues Supabase)
CREATE OR REPLACE VIEW "PARTIS_POLITIQUES" AS SELECT id AS "ID", code AS "CODE", nom_parti AS "NOM_PARTI", nom_arabe AS "NOM_ARABE", sigle_arabe AS "SIGLE_ARABE", couleur_hex AS "COULEUR_HEX", tete_liste AS "TETE_LISTE", logo_icon AS "LOGO_ICON", ordre_affichage AS "ORDRE_AFFICHAGE" FROM partis_politiques;

CREATE OR REPLACE VIEW "BUREAUX_VOTE" AS SELECT id AS "ID", code_bureau AS "CODE_BUREAU", commune AS "COMMUNE", centre_vote AS "CENTRE_VOTE", numero_bureau AS "NUMERO_BUREAU", adresse AS "ADRESSE", nombre_inscrits AS "NOMBRE_INSCRITS" FROM bureaux_vote;

CREATE OR REPLACE VIEW "PV_BUREAUX" AS SELECT id AS "ID", bureau_id AS "BUREAU_ID", nombre_votants AS "NOMBRE_VOTANTS", bulletins_nuls AS "BULLETINS_NULS", bulletins_blancs AS "BULLETINS_BLANCS", suffrages_exprimes AS "SUFFRAGES_EXPRIMES", est_valide AS "EST_VALIDE", note_anomalie AS "NOTE_ANOMALIE", saisi_par AS "SAISI_PAR", created_at AS "CREATED_AT", updated_at AS "UPDATED_AT" FROM pv_bureaux;

CREATE OR REPLACE VIEW "VOTES_PARTIS" AS SELECT id AS "ID", pv_id AS "PV_ID", parti_id AS "PARTI_ID", nombre_voix AS "NOMBRE_VOIX" FROM votes_partis;

CREATE OR REPLACE VIEW "UTILISATEURS" AS SELECT id AS "ID", username AS "USERNAME", password AS "PASSWORD", role AS "ROLE", bureau_id AS "BUREAU_ID", nom_responsable AS "NOM_RESPONSABLE", tel AS "TEL", created_at AS "CREATED_AT" FROM utilisateurs;

-- 7. Insertion de l'administrateur principal
INSERT INTO utilisateurs (username, password, role, nom_responsable)
VALUES ('salama', 'electorale@1475963', 'admin', 'Administrateur Principal (salama)')
ON CONFLICT (username) DO NOTHING;

-- 8. Insertion des Partis Politiques principaux de Laâyoune
INSERT INTO partis_politiques (code, nom_parti, nom_arabe, sigle_arabe, couleur_hex, tete_liste, ordre_affichage)
VALUES 
  ('RNI', 'Rassemblement National des Indépendants', 'التجمع الوطني للأحرار', 'أحرار', '#0066B3', 'Candidat RNI Laâyoune', 1),
  ('PAM', 'Parti Authenticité et Modernité', 'حزب الأصالة والمعاصرة', 'أصالة', '#008080', 'Candidat PAM Laâyoune', 2),
  ('PI', 'Parti de l''Istiqlal', 'حزب الاستقلال', 'استقلال', '#1E3A8A', 'Candidat PI Laâyoune', 3),
  ('USFP', 'Union Socialiste des Forces Populaires', 'الاتحاد الاشتراكي للقوات الشعبية', 'اتحاد اشتراكي', '#DC2626', 'Candidat USFP Laâyoune', 4),
  ('MP', 'Mouvement Populaire', 'الحركة الشعبية', 'حركة', '#16A34A', 'Candidat MP Laâyoune', 5),
  ('PPS', 'Parti du Progrès et du Socialisme', 'حزب التقدم والاشتراكية', 'تقدم', '#0D9488', 'Candidat PPS Laâyoune', 6),
  ('UC', 'Union Constitutionnelle', 'الاتحاد الدستوري', 'دستوري', '#EA580C', 'Candidat UC Laâyoune', 7),
  ('PJD', 'Parti de la Justice et du Développement', 'حزب العدالة والتنمية', 'عدالة وتنمية', '#15803D', 'Candidat PJD Laâyoune', 8),
  ('FGD', 'Fédération de la Gauche Démocratique', 'فيدرالية اليسار الديمقراطي', 'يسار', '#B91C1C', 'Candidat FGD Laâyoune', 9),
  ('MDS', 'Mouvement Démocratique et Social', 'الحركة الديمقراطية والاجتماعية', 'حركة ديمقراطية', '#854D0E', 'Candidat MDS Laâyoune', 10)
ON CONFLICT (code) DO NOTHING;

-- 9. Désactivation RLS (Row Level Security) pour autoriser les requêtes API REST
ALTER TABLE partis_politiques DISABLE ROW LEVEL SECURITY;
ALTER TABLE bureaux_vote DISABLE ROW LEVEL SECURITY;
ALTER TABLE pv_bureaux DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes_partis DISABLE ROW LEVEL SECURITY;
ALTER TABLE utilisateurs DISABLE ROW LEVEL SECURITY;
