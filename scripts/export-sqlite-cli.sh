#!/bin/bash
# SQLite → JSON export (sqlite3 CLI 사용)
DB="backup/phase0/dev.db.bak"
OUT="sqlite-export.json"

tables=(
  "Settings"
  "User"
  "Post"
  "Attachment"
  "FeeStatus"
  "FeePaymentAccount"
  "StandingCommittee"
  "SeparateRegistry"
  "Resolution"
  "Popup"
  "HeroConfig"
  "BoardSettings"
  "Rule"
  "MediaFolder"
  "FileAsset"
  "Comment"
  "Like"
)

echo "{"
first_table=true
for table in "${tables[@]}"; do
  if [ "$first_table" = true ]; then
    first_table=false
  else
    echo ","
  fi
  key=$(echo "$table" | sed 's/^./\l&/' | sed 's/Settings$/Settings/' | sed 's/^Settings$/settings/' | sed 's/^User$/users/' | sed 's/^Post$/posts/' | sed 's/^Attachment$/attachments/' | sed 's/^FeeStatus$/feeStatuses/' | sed 's/^FeePaymentAccount$/feePaymentAccounts/' | sed 's/^StandingCommittee$/standingCommittees/' | sed 's/^SeparateRegistry$/separateRegistries/' | sed 's/^Resolution$/resolutions/' | sed 's/^Popup$/popups/' | sed 's/^HeroConfig$/heroConfigs/' | sed 's/^BoardSettings$/boardSettings/' | sed 's/^Rule$/rules/' | sed 's/^MediaFolder$/mediaFolders/' | sed 's/^FileAsset$/fileAssets/' | sed 's/^Comment$/comments/' | sed 's/^Like$/likes/')
  printf '  "%s": ' "$key"
  sqlite3 -json "$DB" "SELECT * FROM \"$table\";" 2>/dev/null || echo "[]"
done
echo ""
echo "}"
