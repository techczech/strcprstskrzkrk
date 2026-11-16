import type { APIRoute } from "astro";
import { ordered, sounds, twisterUrl } from "../lib/content";

export const GET: APIRoute = () => {
  const items = [
    ...ordered.map((t) => ({ s: "twisters", t: t.text, d: `${t.translation} · ${t.level}`, u: twisterUrl(t), k: `${t.trains.join(" ")} ${t.steps.join(" ")}` })),
    ...sounds.map((s) => ({ s: "sounds", t: `${s.letters} · ${s.name}`, d: s.description, u: `/sounds/#${s.slug}`, k: s.examples.map((e) => `${e.word} ${e.gloss}`).join(" ") })),
    { s: "pages", t: "About", d: "How to practise and how the audio is made", u: "/about/" },
  ];
  return new Response(JSON.stringify({ sections: [{ slug: "twisters", name: "Tongue twisters" }, { slug: "sounds", name: "Sounds" }, { slug: "pages", name: "Pages" }], items }), { headers: { "Content-Type": "application/json" } });
};
