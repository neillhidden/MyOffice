#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci --cache /workspace/.cache/npm --no-audit --no-fund
if [ ! -x node_modules/electron/dist/electron ]; then
  electron_archive=$(mktemp /tmp/myoffice-electron-XXXXXX.zip)
  trap 'rm -f "$electron_archive"' EXIT
  curl --fail --location --silent --show-error 'https://github.com/electron/electron/releases/download/v44.7.0/electron-v44.7.0-linux-x64.zip' -o "$electron_archive"
  python3 - "$electron_archive" <<'PY'
import hashlib,json,sys,zipfile
from pathlib import Path
archive=Path(sys.argv[1]);package=Path('node_modules/electron');expected=json.loads((package/'checksums.json').read_text())['electron-v44.7.0-linux-x64.zip']
assert hashlib.sha256(archive.read_bytes()).hexdigest()==expected,'Electron checksum mismatch'
root=package/'dist';root.mkdir(exist_ok=True)
with zipfile.ZipFile(archive) as z:z.extractall(root)
(root/'electron').chmod(0o755)
PY
fi
printf 'electron' > node_modules/electron/path.txt
ELECTRON_RUN_AS_NODE=1 node_modules/electron/dist/electron -e "if(!require('node:sqlite').DatabaseSync)process.exit(1)"
