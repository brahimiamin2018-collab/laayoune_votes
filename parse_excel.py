import openpyxl
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
wb = openpyxl.load_workbook(r'C:\Users\93SAL\Desktop\bdd\representant_bureau.xlsx')
sheet = wb.active
rows = []
for r in sheet.iter_rows(values_only=True):
    vals = [c for c in r if c is not None]
    if len(vals) >= 2 and isinstance(vals[0], int):
        rows.append({'num': vals[0], 'commune_ar': str(vals[1]).strip()})

print(json.dumps(rows, ensure_ascii=False))
