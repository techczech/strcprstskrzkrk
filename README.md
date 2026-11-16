# Strč prst skrz krk

Czech tongue twisters with audio, at https://strcprstskrzkrk.com. A static Astro site: no server code, no accounts, and no API calls from the browser.

## Content

- `src/data/twisters.json`: the twisters (text, translation, level, IPA, notes, tips, back-chaining steps; the last step is the whole twister).
- `src/data/sounds.json`: the sounds guide, with example words.
- Edit these files to change the content. Everything on the site is generated from them.

## Audio

All audio is synthetic speech made at build time with OpenAI text-to-speech (`gpt-4o-mini-tts-2025-12-15`, voices Marin and Cedar) and committed under `public/audio/`. `src/data/audio-manifest.json` maps each clip to its file and records what Czech speech recognition heard when the clip was transcribed back.

```sh
npm run audio:status     # what would change; no key needed
npm run audio:generate   # make clips for new or changed text only, remove orphans
npm run audio:check      # list clips that did not transcribe back exactly
```

A clip is regenerated only when its text, voice, model or speaking instructions change (hash in the file name). Generation retries up to three times when the transcription does not match and keeps the closest take; `node scripts/audio.mjs generate --retry-flagged` tries harder on the flagged ones.

The key: `scripts/with-openai-key.sh` hands the OpenAI key from Bitwarden Secrets Manager (secret `OPENAI-VOICETESTING-PRIVATE`, project `agentdev`) to that one command as `OPENAI_API_KEY`. It is never written to disk, the repo or the site.

## Develop and deploy

```sh
npm install
npm run dev
npm run build && npm test
node scripts/screens.mjs docs/design/screens   # screenshots for review
```

Hosting: Cloudflare Pages project `strcprstskrzkrk`, direct upload of `dist/`, custom domain `strcprstskrzkrk.com`:

```sh
python3 <bws-skill>/scripts/bws_manager.py run --secret-id <CLOUDFLARE_API_TOKEN id> --as CLOUDFLARE_API_TOKEN -- \
  npx wrangler pages deploy dist --project-name strcprstskrzkrk --branch main
```

Fonts: Fraunces and Inter (fontsource, OFL); IPA in a Latin-plus-IPA subset of Charis 7 by SIL (`public/fonts/`, OFL).

The previous version (Google AI Studio app on Cloud Run with live Gemini speech) is in Git history before the `astro-rebuild` branch.
