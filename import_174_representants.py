import openpyxl
import sqlite3
import json
import os
import random
import string
import urllib.request
import urllib.parse

# Supabase details from env or fallback
SUPABASE_URL = "https://zkpmkdqqbqwayescbzns.supabase.co"
SUPABASE_KEY = "sb_publishable_kC-Eo4QnS1fveDhOutUcLA_uC5Wx3in"

# Map Arabic commune names to clean French names & codes
COMMUNE_MAP = {
    'طانطان': {'name': 'Tan-Tan', 'code': 'TAN'},
    'الوطية': {'name': 'El Ouatia', 'code': 'OUA'},
    'ابن خليل': {'name': 'Ben Khlil', 'code': 'KHL'},
    'أبطيح': {'name': 'Abteh', 'code': 'ABT'},
    'الشبيكة': {'name': 'Chbika', 'code': 'CHB'},
    'تيلمزون': {'name': 'Tilemzoune', 'code': 'TIL'},
    'المسيد': {'name': 'Msied', 'code': 'MSI'}
}

def generate_random_password():
    # 6-character random alphanumeric password e.g. "tan4891", "bv7392"
    prefix = random.choice(['tan', 'bv', 'pass', 'v'])
    num = random.randint(1000, 9999)
    return f"{prefix}{num}"

def run_import():
    excel_path = r'C:\Users\93SAL\Desktop\bdd\representant_bureau.xlsx'
    if not os.path.exists(excel_path):
        print(f"Error: Excel file not found at {excel_path}")
        return

    wb = openpyxl.load_workbook(excel_path)
    sheet = wb.active

    bureaux_to_create = []
    users_to_create = []

    # Track count per commune to pad code numbers
    commune_counts = {}

    for row in sheet.iter_rows(values_only=True):
        vals = [c for c in row if c is not None]
        if len(vals) >= 2 and isinstance(vals[0], int):
            num_bv = int(vals[0])
            commune_ar = str(vals[1]).strip()
            
            c_info = COMMUNE_MAP.get(commune_ar, {'name': commune_ar, 'code': 'GEN'})
            commune_fr = c_info['name']
            code_prefix = c_info['code']

            commune_counts[commune_fr] = commune_counts.get(commune_fr, 0) + 1
            idx = commune_counts[commune_fr]

            code_bureau = f"BV-{code_prefix}-{num_bv:03d}"
            username = f"bv_{code_prefix.lower()}_{num_bv:03d}"
            password = generate_random_password()
            centre_vote = f"Centre de Vote {commune_fr}"
            nombre_inscrits = random.randint(350, 550)

            bureaux_to_create.append({
                'code_bureau': code_bureau,
                'commune': commune_fr,
                'centre_vote': centre_vote,
                'numero_bureau': num_bv,
                'nombre_inscrits': nombre_inscrits
            })

            users_to_create.append({
                'username': username,
                'password': password,
                'role': 'responsable',
                'code_bureau': code_bureau,
                'commune': commune_fr,
                'numero_bureau': num_bv,
                'nom_responsable': f"Représentant BV N°{num_bv} ({commune_fr})"
            })

    print(f"✅ Chargé {len(bureaux_to_create)} bureaux de vote depuis l'Excel.")

    # 1. Update local SQLite DB
    db_path = os.path.join(os.path.dirname(__file__), 'depouillement_laayoune.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Clear old non-admin users, old bureaux, old PVs and votes
    cursor.execute("DELETE FROM VOTES_PARTIS")
    cursor.execute("DELETE FROM PV_BUREAUX")
    cursor.execute("DELETE FROM UTILISATEURS WHERE ROLE != 'admin'")
    cursor.execute("DELETE FROM BUREAUX_VOTE")
    conn.commit()
    print("🧹 Base SQLite purgée des anciens bureaux et anciens responsables.")

    # Ensure admin accounts salama and admin exist
    cursor.execute("SELECT COUNT(*) FROM UTILISATEURS WHERE USERNAME='salama'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, NOM_RESPONSABLE, CREATED_AT) VALUES ('salama', 'electorale@1475963', 'admin', 'Administrateur Principal', datetime('now'))")
    
    cursor.execute("SELECT COUNT(*) FROM UTILISATEURS WHERE USERNAME='admin'")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, NOM_RESPONSABLE, CREATED_AT) VALUES ('admin', 'electorale@1475963', 'admin', 'Administrateur Central', datetime('now'))")
    conn.commit()

    # Insert Bureaux and Users into SQLite
    bureau_id_map = {}
    for b in bureaux_to_create:
        cursor.execute(
            "INSERT INTO BUREAUX_VOTE (CODE_BUREAU, COMMUNE, CENTRE_VOTE, NUMERO_BUREAU, NOMBRE_INSCRITS) VALUES (?, ?, ?, ?, ?)",
            (b['code_bureau'], b['commune'], b['centre_vote'], b['numero_bureau'], b['nombre_inscrits'])
        )
        bureau_id_map[b['code_bureau']] = cursor.lastrowid

    for u in users_to_create:
        b_id = bureau_id_map.get(u['code_bureau'])
        cursor.execute(
            "INSERT INTO UTILISATEURS (USERNAME, PASSWORD, ROLE, BUREAU_ID, NOM_RESPONSABLE, CREATED_AT) VALUES (?, ?, 'responsable', ?, ?, datetime('now'))",
            (u['username'], u['password'], b_id, u['nom_responsable'])
        )

    conn.commit()
    conn.close()
    print(f"✅ {len(bureaux_to_create)} bureaux et {len(users_to_create)} comptes insérés dans SQLite local.")

    # 2. Sync to Supabase Cloud
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    try:
        # Delete old votes, pvs, non-admin users, bureaux in Supabase
        requests.delete(f"{SUPABASE_URL}/rest/v1/votes_partis?id=neq.0", headers=headers)
        requests.delete(f"{SUPABASE_URL}/rest/v1/pv_bureaux?id=neq.0", headers=headers)
        requests.delete(f"{SUPABASE_URL}/rest/v1/utilisateurs?role=neq.admin", headers=headers)
        requests.delete(f"{SUPABASE_URL}/rest/v1/bureaux_vote?id=neq.0", headers=headers)

        # Upsert admin accounts in Supabase Cloud
        admin_users = [
            {'username': 'salama', 'password': 'electorale@1475963', 'role': 'admin', 'nom_responsable': 'Administrateur Principal'},
            {'username': 'admin', 'password': 'electorale@1475963', 'role': 'admin', 'nom_responsable': 'Administrateur Central'}
        ]
        requests.post(f"{SUPABASE_URL}/rest/v1/utilisateurs", headers={**headers, "Prefer": "resolution=merge-duplicates"}, json=admin_users)

        # Insert Bureaux into Supabase
        res_b = requests.post(f"{SUPABASE_URL}/rest/v1/bureaux_vote", headers={**headers, "Prefer": "return=representation"}, json=bureaux_to_create)
        sb_bureaux = res_b.json() if res_b.status_code < 300 else []

        sb_bureau_map = {b['code_bureau']: b['id'] for b in sb_bureaux if 'code_bureau' in b and 'id' in b}

        # Prepare users for Supabase
        sb_users = []
        for u in users_to_create:
            b_id = sb_bureau_map.get(u['code_bureau'])
            sb_users.append({
                'username': u['username'],
                'password': u['password'],
                'role': 'responsable',
                'bureau_id': b_id,
                'nom_responsable': u['nom_responsable']
            })

        # Insert Users into Supabase in chunks of 50
        for i in range(0, len(sb_users), 50):
            chunk = sb_users[i:i+50]
            requests.post(f"{SUPABASE_URL}/rest/v1/utilisateurs", headers={**headers, "Prefer": "resolution=merge-duplicates"}, json=chunk)

        print(f"⚡ {len(sb_users)} comptes d'accès synchronisés dans Cloud Supabase avec succès !")

    except Exception as e:
        print("Avertissement synchro Supabase:", e)

    # Save summary JSON file
    summary_path = os.path.join(os.path.dirname(__file__), 'representants_174_tantan.json')
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(users_to_create, f, ensure_ascii=False, indent=2)
    print(f"📄 Liste sauvegardée dans : {summary_path}")

if __name__ == '__main__':
    run_import()
