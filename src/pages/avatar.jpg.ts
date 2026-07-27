import type { APIRoute } from "astro";
import { getResearcher } from "../lib/researchmap";

// Build-time endpoint: downloads the researchmap avatar into dist/avatar.jpg
// so the published site does not hotlink researchmap.
export const GET: APIRoute = async () => {
  const { profile } = await getResearcher();
  if (!profile.image) return new Response(null, { status: 404 });
  const res = await fetch(profile.image);
  if (!res.ok) return new Response(null, { status: 404 });
  return new Response(await res.arrayBuffer(), {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
    },
  });
};
