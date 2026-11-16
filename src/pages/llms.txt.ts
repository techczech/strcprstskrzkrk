import type { APIRoute } from "astro";
import { ordered, sounds, SITE_DESCRIPTION } from "../lib/content";

export const GET: APIRoute = ({ site }) => {
  const u = (p: string) => new URL(p, site).href;
  const body = [
    "# Strč prst skrz krk", "", `> ${SITE_DESCRIPTION}`, "",
    "Static site by Dominik Lukeš. All audio is pre-generated synthetic speech; the site makes no API calls.", "",
    "## Tongue twisters", "", ...ordered.map((t) => `- [${t.text}](${u(`/twisters/${t.slug}.md`)}): ${t.translation} (${t.level})`), "",
    "## Sounds", "", ...sounds.map((s) => `- [${s.letters}](${u(`/sounds/#${s.slug}`)}): ${s.description}`), "",
    "## Data", "", `- [Search index](${u("/search-index.json")})`, "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
