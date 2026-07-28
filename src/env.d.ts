/// <reference types="astro/client" />

type KVNamespace = import("@cloudflare/workers-types").KVNamespace;

declare namespace Cloudflare {
  interface Env {
    RESEARCHMAP: KVNamespace;
    RESEARCHMAP_PERMALINK: string;
  }
}
