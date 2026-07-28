import type { APIRoute } from "astro";
import { getAvatar, getResearcher } from "../lib/researchmap";

// Serves the researchmap avatar from KV so the site does not hotlink
// researchmap. Falls back to a direct fetch while KV is still cold.
export const GET: APIRoute = async ({ locals }) => {
  const avatar = await getAvatar();
  if (avatar) {
    return new Response(avatar.bytes, {
      headers: {
        "Content-Type": avatar.contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const { profile } = await getResearcher(locals.cfContext);
  if (!profile.image) return new Response(null, { status: 404 });
  const res = await fetch(profile.image);
  if (!res.ok) return new Response(null, { status: 404 });
  return new Response(await res.arrayBuffer(), {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
    },
  });
};
