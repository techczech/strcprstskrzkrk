import type { APIRoute } from "astro";
import { ordered, firstAudio, type Twister } from "../../lib/content";

export function getStaticPaths() {
  return ordered.map((t) => ({ params: { slug: t.slug }, props: { t } }));
}
export const twisterMarkdown = (t: Twister, site: URL) => {
  const audio = firstAudio(`tw/${t.slug}/${t.steps.length - 1}`);
  return [
    `# ${t.text}`, "",
    `- Translation: ${t.translation}`, `- Level: ${t.level}`, `- Trains: ${t.trains.join(", ")}`, `- IPA: [${t.ipa}]`,
    audio ? `- Audio: ${new URL(audio, site).href}` : "", "",
    t.about, "", "## Build it up from the end", "", ...t.steps.map((s, i) => `${i + 1}. ${s}`), "",
    "## How to say it", "", ...t.tips.map((x) => `- ${x}`), "",
  ].join("\n");
};
export const GET: APIRoute = ({ props, site }) =>
  new Response(twisterMarkdown(props.t as Twister, site!), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
