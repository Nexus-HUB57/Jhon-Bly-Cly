#!/usr/bin/env python3
"""
Deploy myvideos para mybait.org via cPanel
Múltiplos métodos: UAPI (com retry), Git, SFTP

Uso:
  python3 deploy_cpanel.py --method uapi    # cPanel UAPI (com retry/backoff)
  python3 deploy_cpanel.py --method git     # Git-based deploy via cPanel
  python3 deploy_cpanel.py --method sftp    # SFTP/SCP direto
  python3 deploy_cpanel.py --method all     # Tenta todos em sequência
"""

import os
import sys
import json
import time
import argparse
import subprocess
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from base64 import b64encode
import ssl

# ─── Config ───────────────────────────────────────────────────────

NETLIFY_DIR = Path(__file__).parent / "netlify"
REMOTE_ROOT = "public_html"

# cPanel credentials (from env vars)
CPANEL_HOST = os.environ.get("CPANEL_HOST", "")  # e.g., "server.example.com:2083"
CPANEL_USER = os.environ.get("CPANEL_USER", "")
CPANEL_TOKEN = os.environ.get("CPANEL_TOKEN", "")  # cPanel API Token

# SFTP credentials
SFTP_HOST = os.environ.get("SFTP_HOST", "")
SFTP_USER = os.environ.get("SFTP_USER", "")
SFTP_PASS = os.environ.get("SFTP_PASS", "")

# File mapping: local → remote
FILE_MAP = {
    "index.html": f"{REMOTE_ROOT}/index.html",
    "blockchain.html": f"{REMOTE_ROOT}/blockchain.html",
    "bainkr.html": f"{REMOTE_ROOT}/bainkr.html",
    "faucet.html": f"{REMOTE_ROOT}/faucet.html",
    "fundo.html": f"{REMOTE_ROOT}/fundo.html",
    "swap.html": f"{REMOTE_ROOT}/swap.html",
    "myvideo.html": f"{REMOTE_ROOT}/myvideo.html",
    "api.cgi": f"{REMOTE_ROOT}/api.cgi",
    "favicon.svg": f"{REMOTE_ROOT}/favicon.svg",
}

MAX_RETRIES = 5
RETRY_DELAY = 10  # seconds

# ─── UAPI Deploy ─────────────────────────────────────────────────

def uapi_upload(local_path: str, remote_path: str) -> bool:
    """Upload file via cPanel UAPI with retry/backoff."""
    if not CPANEL_HOST or not CPANEL_USER or not CPANEL_TOKEN:
        print("  ⚠ Credenciais cPanel não configuradas (CPANEL_HOST, CPANEL_USER, CPANEL_TOKEN)")
        return False

    content = Path(local_path).read_bytes()
    content_b64 = b64encode(content).decode()

    url = f"https://{CPANEL_HOST}/execute/Fileman/upload_files"
    data = json.dumps({
        "dir": str(Path(remote_path).parent),
        "file": content_b64,
        "name": Path(remote_path).name,
    }).encode()

    for attempt in range(MAX_RETRIES):
        try:
            req = Request(url, data=data, method="POST")
            req.add_header("Authorization", f"cpanel {CPANEL_USER}:{CPANEL_TOKEN}")
            req.add_header("Content-Type", "application/json")

            ctx = ssl.create_default_context()
            resp = urlopen(req, timeout=120, context=ctx)
            result = json.loads(resp.read())

            if result.get("status") == 1:
                print(f"    ✓ {remote_path}")
                return True
            else:
                print(f"    ✗ {remote_path}: {result.get('errors', ['unknown'])}")
                return False

        except HTTPError as e:
            if e.code == 522:
                delay = RETRY_DELAY * (2 ** attempt)
                print(f"    ⏳ 522 timeout, retry {attempt+1}/{MAX_RETRIES} em {delay}s...")
                time.sleep(delay)
            else:
                print(f"    ✗ HTTP {e.code}: {e.read().decode()[:100]}")
                return False
        except URLError as e:
            delay = RETRY_DELAY * (2 ** attempt)
            print(f"    ⏳ Connection error, retry {attempt+1}/{MAX_RETRIES} em {delay}s...")
            time.sleep(delay)
        except Exception as e:
            print(f"    ✗ Erro: {e}")
            return False

    print(f"    ✗ Falha após {MAX_RETRIES} tentativas: {remote_path}")
    return False


def deploy_uapi() -> bool:
    """Deploy all files via cPanel UAPI."""
    print("📡 Deploy via cPanel UAPI...")
    success = True
    for local_name, remote_path in FILE_MAP.items():
        local = NETLIFY_DIR / local_name
        if not local.exists():
            print(f"    ⚠ Arquivo não encontrado: {local}")
            continue
        print(f"  Upload {local_name} → {remote_path}")
        if not uapi_upload(str(local), remote_path):
            success = False
    return success


# ─── Git Deploy ──────────────────────────────────────────────────

def deploy_git() -> bool:
    """Deploy via Git push to cPanel repository."""
    print("📡 Deploy via Git...")

    # Check if gh is available
    try:
        subprocess.run(["git", "--version"], capture_output=True, check=True)
    except:
        print("  ✗ Git não disponível")
        return False

    # The netlify files are already in the repo, just push
    try:
        result = subprocess.run(
            ["git", "push", "origin", "main"],
            capture_output=True, text=True, timeout=60,
            cwd=str(Path(__file__).parent)
        )
        if result.returncode == 0:
            print("  ✓ Push para GitHub concluído")
            print("  ℹ Configure cPanel → Git™ Version Control para auto-deploy")
            print("  ℹ Ou use .cpanel.yml no root do repo:")
            print("""
  ---
  deployment:
    tasks:
      - export DEPLOYPATH=/home/$USER/public_html/
      - /bin/cp -r netlify/* $DEPLOYPATH
            """)
            return True
        else:
            print(f"  ✗ Git push falhou: {result.stderr[:200]}")
            return False
    except Exception as e:
        print(f"  ✗ Erro: {e}")
        return False


# ─── SFTP Deploy ─────────────────────────────────────────────────

def deploy_sftp() -> bool:
    """Deploy via SFTP/SCP."""
    print("📡 Deploy via SFTP...")

    if not SFTP_HOST or not SFTP_USER:
        print("  ⚠ Credenciais SFTP não configuradas (SFTP_HOST, SFTP_USER, SFTP_PASS)")
        return False

    try:
        # Use scp for each file
        for local_name, remote_path in FILE_MAP.items():
            local = NETLIFY_DIR / local_name
            if not local.exists():
                continue

            scp_target = f"{SFTP_USER}@{SFTP_HOST}:{remote_path}"
            result = subprocess.run(
                ["scp", "-o", "StrictHostKeyChecking=no", str(local), scp_target],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                print(f"  ✓ {local_name} → {remote_path}")
            else:
                print(f"  ✗ {local_name}: {result.stderr[:100]}")
                return False

        return True
    except Exception as e:
        print(f"  ✗ Erro: {e}")
        return False


# ─── Main ────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Deploy myvideos para mybait.org")
    parser.add_argument("--method", choices=["uapi", "git", "sftp", "all"], default="all")
    args = parser.parse_args()

    if not NETLIFY_DIR.exists():
        print(f"✗ Diretório netlify não encontrado: {NETLIFY_DIR}")
        sys.exit(1)

    print(f"✦ Deploy myvideos → mybait.org")
    print(f"  Arquivos: {len(list(NETLIFY_DIR.iterdir()))}")
    print(f"  Método: {args.method}")
    print()

    if args.method == "all":
        # Try methods in order of reliability
        for method, func in [("git", deploy_git), ("sftp", deploy_sftp), ("uapi", deploy_uapi)]:
            if func():
                print(f"\n✓ Deploy concluído via {method}!")
                sys.exit(0)
            print()
        print("✗ Todos os métodos falharam")
        sys.exit(1)
    else:
        func = {"uapi": deploy_uapi, "git": deploy_git, "sftp": deploy_sftp}[args.method]
        if func():
            print(f"\n✓ Deploy concluído via {args.method}!")
        else:
            print(f"\n✗ Deploy falhou via {args.method}")
            sys.exit(1)


if __name__ == "__main__":
    main()
