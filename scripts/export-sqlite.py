#!/usr/bin/env python3
"""SQLite → sqlite-export.json (Prisma 모델명 기준 camelCase key)"""
import sqlite3, json, sys
from pathlib import Path

DB = Path("backup/phase0/dev.db.bak")
OUT = Path("sqlite-export.json")

TABLE_MAP = {
    "settings":            "settings",
    "users":               "users",
    "posts":               "posts",
    "attachments":         "attachments",
    "fee_statuses":        "feeStatuses",
    "fee_payment_accounts":"feePaymentAccounts",
    "standing_committees": "standingCommittees",
    "separate_registries": "separateRegistries",
    "resolutions":         "resolutions",
    "popups":              "popups",
    "hero_configs":        "heroConfigs",
    "board_settings":      "boardSettings",
    "rules":               "rules",
    "media_folders":       "mediaFolders",
    "file_assets":         "fileAssets",
    "comments":            "comments",
    "likes":               "likes",
}

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
result = {}
total = 0

for table, key in TABLE_MAP.items():
    try:
        rows = [dict(r) for r in con.execute(f'SELECT * FROM "{table}"')]
        result[key] = rows
        print(f"  {key}: {len(rows)}건")
        total += len(rows)
    except sqlite3.OperationalError as e:
        print(f"  {key}: SKIP ({e})", file=sys.stderr)
        result[key] = []

con.close()
OUT.write_text(json.dumps(result, ensure_ascii=False, default=str), encoding="utf-8")
print(f"\n총 {total}건 → {OUT}")
