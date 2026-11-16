import type { APIRoute } from "astro";
import { ordered, twisterUrl } from "../lib/content";
export const GET: APIRoute = ({ site }) =>
  new Response(["/", "/sounds/", "/about/", ...ordered.map(twisterUrl)].map((p) => new URL(p, site).href).join("\n") + "\n", { headers: { "Content-Type": "text/plain" } });
