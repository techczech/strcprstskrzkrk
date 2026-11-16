#!/bin/sh
# Deploys dist/ to Cloudflare Pages. Usage: scripts/deploy.sh [branch]   (main = production)
# The Cloudflare token comes from Bitwarden (secret CLOUDFLARE_API_TOKEN, project agentdev) for this one command only.
set -eu
cd "$(dirname "$0")/.."
BRANCH="${1:-main}"
BWS_MANAGER="${BWS_MANAGER:-$HOME/.claude_personal/skills/bws-secrets-manager/scripts/bws_manager.py}"
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-b6ae5bced06492ee6f0c8f92776804da}"
exec python3 "$BWS_MANAGER" run --secret-id "${CLOUDFLARE_SECRET_ID:-371a4ca7-cf89-48fb-85bb-b46a00e5fefb}" --as CLOUDFLARE_API_TOKEN -- \
  npx wrangler pages deploy dist --project-name strcprstskrzkrk --branch "$BRANCH" --commit-hash "$(git rev-parse HEAD)"
