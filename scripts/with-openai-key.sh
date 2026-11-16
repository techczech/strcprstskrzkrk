#!/bin/sh
# Runs one command with the OpenAI key from Bitwarden Secrets Manager as OPENAI_API_KEY, for that process only.
# The key is never written to disk; bws_manager masks it in the command's output.
# Secret: OPENAI-VOICETESTING-PRIVATE in the agentdev project (ID only here, never the value).
# Example: scripts/with-openai-key.sh node scripts/audio.mjs generate
set -eu
SECRET_ID="${OPENAI_SECRET_ID:-c2286c7f-a21e-4f4a-b9b2-b4f900f80c37}"
BWS_MANAGER="${BWS_MANAGER:-$HOME/.claude_personal/skills/bws-secrets-manager/scripts/bws_manager.py}"
exec python3 "$BWS_MANAGER" run --secret-id "$SECRET_ID" --as OPENAI_API_KEY -- "$@"
