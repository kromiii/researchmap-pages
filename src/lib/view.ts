/* eslint-disable @typescript-eslint/no-explicit-any --
   researchmap's JSON-LD API shape differs per section and changes without
   notice; we deliberately don't model it and treat it as untyped at this
   boundary instead of chasing field-level types. */

// Builds language-specific view models from raw researchmap data,
// keeping the .astro templates free of data-wrangling logic.

export type Lang = "ja" | "en";

const UI = {
  ja: {
    present: "現在",
    refereed: "査読あり",
    invited: "招待",
    generatedNote: "researchmap のデータをもとに自動生成されています。",
    recentTitle: "新着",
    badgeNew: "NEW",
    lastUpdated: "最終更新",
    tabs: {
      profile: "プロフィール",
      publications: "論文",
      talks: "発表",
      career: "受賞・他",
    } as Record<string, string>,
    sections: {
      research_interests: "研究キーワード",
      research_areas: "研究分野",
      research_experience: "経歴",
      education: "学歴",
      awards: "受賞",
      published_papers: "論文",
      presentations: "講演・口頭発表等",
      research_projects: "共同研究・競争的資金等の研究課題",
      association_memberships: "所属学協会",
      academic_contribution: "学術貢献活動",
      social_contribution: "社会貢献活動",
      others: "その他",
    } as Record<string, string>,
    presentationType: {
      oral_presentation: "口頭発表",
      poster_presentation: "ポスター発表",
      invited_oral_presentation: "招待講演",
      keynote_oral_presentation: "基調講演",
      public_symposium: "シンポジウム",
    } as Record<string, string>,
    paperType: {
      scientific_journal: "学術雑誌",
      international_conference_proceedings: "国際会議録",
      research_society: "研究会",
      symposium: "シンポジウム",
      doctoral_thesis: "博士論文",
      master_thesis: "修士論文",
    } as Record<string, string>,
  },
  en: {
    present: "Present",
    refereed: "Refereed",
    invited: "Invited",
    generatedNote: "Automatically generated from researchmap data.",
    recentTitle: "What's New",
    badgeNew: "NEW",
    lastUpdated: "Last updated",
    tabs: {
      profile: "Profile",
      publications: "Publications",
      talks: "Talks",
      career: "Awards & More",
    } as Record<string, string>,
    sections: {
      research_interests: "Research Interests",
      research_areas: "Research Areas",
      research_experience: "Experience",
      education: "Education",
      awards: "Awards",
      published_papers: "Publications",
      presentations: "Presentations",
      research_projects: "Research Projects",
      association_memberships: "Memberships",
      academic_contribution: "Academic Contributions",
      social_contribution: "Social Contributions",
      others: "Others",
    } as Record<string, string>,
    presentationType: {
      oral_presentation: "Oral",
      poster_presentation: "Poster",
      invited_oral_presentation: "Invited talk",
      keynote_oral_presentation: "Keynote",
      public_symposium: "Symposium",
    } as Record<string, string>,
    paperType: {
      scientific_journal: "Journal",
      international_conference_proceedings: "Int'l conference",
      research_society: "Research society",
      symposium: "Symposium",
      doctoral_thesis: "Doctoral thesis",
      master_thesis: "Master's thesis",
    } as Record<string, string>,
  },
};

export function uiStrings(lang: Lang) {
  return UI[lang];
}

/** Tab layout: which achievement sections appear on which tab. */
export const TABS: { id: string; sections: string[] }[] = [
  {
    id: "profile",
    sections: ["research_interests", "research_areas", "research_experience"],
  },
  { id: "publications", sections: ["published_papers"] },
  { id: "talks", sections: ["presentations"] },
  {
    id: "career",
    sections: [
      "awards",
      "education",
      "research_projects",
      "association_memberships",
      "academic_contribution",
      "social_contribution",
      "others",
    ],
  },
];

// ---- View model types ----------------------------------------------------

export interface ItemView {
  title: string;
  sub?: string;
  meta: string[];
  badges: string[];
  links: { href: string; label: string }[];
}

export interface RowView {
  period: string;
  main: string;
  sub?: string;
}

export type SectionView =
  | {
      type: string;
      title: string;
      count?: number;
      kind: "chips";
      chips: string[];
    }
  | {
      type: string;
      title: string;
      count?: number;
      kind: "rows";
      rows: RowView[];
    }
  | {
      type: string;
      title: string;
      count?: number;
      kind: "items";
      items: ItemView[];
    };

export interface HeroView {
  name: string;
  altName: string;
  affiliations: string[];
  bioHtml: string;
  links: { href: string; label: string }[];
}

// ---- Helpers -------------------------------------------------------------

function makeHelpers(lang: Lang) {
  const ui = UI[lang];

  const t = (value: any): string => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] ?? value.ja ?? value.en ?? Object.values(value)[0] ?? "";
  };

  const fmtDate = (s?: string): string => {
    if (!s) return "";
    if (s.startsWith("9999")) return ui.present;
    return s.replaceAll("-", ".");
  };

  const period = (from?: string, to?: string): string =>
    !from && !to ? "" : `${fmtDate(from)} – ${fmtDate(to)}`;

  const names = (value: any): string => {
    const list = t(value);
    if (!Array.isArray(list)) return "";
    return list
      .map((p: any) => p.name)
      .filter(Boolean)
      .join(", ");
  };

  const externalLinks = (item: any): { href: string; label: string }[] => {
    const links: { href: string; label: string }[] = [];
    const doi = item.identifiers?.doi?.[0];
    if (doi) links.push({ href: `https://doi.org/${doi}`, label: "DOI" });
    for (const ref of item.see_also ?? []) {
      if (ref.label === "url" && ref["@id"])
        links.push({ href: ref["@id"], label: "Link" });
    }
    return links;
  };

  const byDateDesc = (items: any[], key: string): any[] =>
    [...items].sort((a, b) =>
      String(b[key] ?? "").localeCompare(String(a[key] ?? "")),
    );

  return { ui, t, fmtDate, period, names, externalLinks, byDateDesc };
}

// ---- Hero ----------------------------------------------------------------

export function buildHero(profile: any, lang: Lang): HeroView {
  const { t } = makeHelpers(lang);
  const jaName =
    `${profile.family_name?.ja ?? ""} ${profile.given_name?.ja ?? ""}`.trim();
  const kanaName =
    `${profile.family_name?.["ja-Kana"] ?? ""} ${profile.given_name?.["ja-Kana"] ?? ""}`.trim();
  const enName =
    `${profile.given_name?.en ?? ""} ${profile.family_name?.en ?? ""}`.trim();

  const affiliations = (profile.affiliations ?? []).map((a: any) =>
    [t(a.affiliation), t(a.section), t(a.job)].filter(Boolean).join(" "),
  );

  const links = [
    {
      href: `https://researchmap.jp/${profile.permalink}`,
      label: "researchmap",
    },
  ];
  for (const ref of profile.see_also ?? []) {
    if (!ref["@id"]) continue;
    if (ref.label === "orcid") links.push({ href: ref["@id"], label: "ORCID" });
    if (ref.label === "url")
      links.push({
        href: ref["@id"],
        label: ref["@id"].replace(/^https?:\/\//, ""),
      });
  }

  return {
    name: lang === "ja" ? jaName : enName,
    altName:
      lang === "ja" ? [kanaName, enName].filter(Boolean).join(" / ") : jaName,
    affiliations,
    bioHtml: t(profile.profile),
    links,
  };
}

export function pageTitle(profile: any, lang: Lang): string {
  const hero = buildHero(profile, lang);
  return [hero.name, hero.altName.split(" / ").pop()]
    .filter(Boolean)
    .join(" | ");
}

// ---- Recent updates ------------------------------------------------------

const TITLE_KEYS: Record<string, string> = {
  research_interests: "keyword",
  research_areas: "research_field",
  research_experience: "affiliation",
  education: "affiliation",
  awards: "award_name",
  published_papers: "paper_title",
  presentations: "presentation_title",
  research_projects: "research_project_title",
  association_memberships: "academic_society_name",
  academic_contribution: "academic_contribution_title",
  social_contribution: "social_contribution_title",
  others: "other_title",
};

export interface RecentUpdate {
  sectionType: string;
  sectionLabel: string;
  title: string;
  date: string;
}

function getItemDate(item: any): string | null {
  if (item["rm:created"]) return item["rm:created"];
  if (item["rm:modified"]) return item["rm:modified"];
  const rawDate =
    item.publication_date ||
    item.award_date ||
    item.from_event_date ||
    item.from_date ||
    item.degree_date;
  if (!rawDate) return null;
  const s = String(rawDate);
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  return s;
}

/** Items newly added to researchmap within the last `days` days. */
export function buildRecentUpdates(
  sections: Record<string, any[]>,
  lang: Lang,
  { days = 90, max = 6 } = {},
): RecentUpdate[] {
  const { ui, t, fmtDate } = makeHelpers(lang);
  const cutoff = Date.now() - days * 86400e3;

  const found: (RecentUpdate & { ts: number })[] = [];
  for (const [type, items] of Object.entries(sections)) {
    const titleKey = TITLE_KEYS[type];
    if (!titleKey) continue;
    for (const item of items) {
      const dateStr = getItemDate(item);
      const created = dateStr ? Date.parse(dateStr) || 0 : 0;
      if (created < cutoff) continue;
      const title = t(item[titleKey]);
      if (!title) continue;
      found.push({
        sectionType: type,
        sectionLabel: ui.sections[type] ?? type,
        title,
        date: fmtDate(new Date(created).toISOString().slice(0, 10)),
        ts: created,
      });
    }
  }

  return found
    .sort((a, b) => b.ts - a.ts)
    .slice(0, max)
    .map(({ ts, ...rest }) => rest);
}

/** Latest researchmap modification date across the profile and all items. */
export function lastUpdated(
  profile: any,
  sections: Record<string, any[]>,
  lang: Lang,
): string {
  const { fmtDate } = makeHelpers(lang);
  let latest = Date.parse(profile["rm:modified"] ?? "") || 0;
  for (const items of Object.values(sections)) {
    for (const item of items) {
      const dateStr = getItemDate(item);
      const ts = dateStr ? Date.parse(dateStr) || 0 : 0;
      latest = Math.max(latest, ts);
    }
  }
  return latest ? fmtDate(new Date(latest).toISOString().slice(0, 10)) : "";
}

// ---- Sections ------------------------------------------------------------

const NO_COUNT = new Set(["research_interests", "research_areas"]);

export function buildSections(
  sections: Record<string, any[]>,
  lang: Lang,
): SectionView[] {
  const h = makeHelpers(lang);
  const { ui, t, fmtDate, period, names, externalLinks, byDateDesc } = h;

  const builders: Record<string, (items: any[]) => SectionView | null> = {
    research_interests: (items) => ({
      type: "research_interests",
      title: ui.sections.research_interests,
      kind: "chips",
      chips: items.map((it) => t(it.keyword)),
    }),

    research_areas: (items) => ({
      type: "research_areas",
      title: ui.sections.research_areas,
      kind: "chips",
      chips: items.map((it) => `${t(it.discipline)} / ${t(it.research_field)}`),
    }),

    research_experience: (items) => ({
      type: "research_experience",
      title: ui.sections.research_experience,
      count: items.length,
      kind: "rows",
      rows: byDateDesc(items, "from_date").map((it) => ({
        period: period(it.from_date, it.to_date),
        main: [t(it.affiliation), t(it.section)].filter(Boolean).join(" "),
        sub: t(it.job),
      })),
    }),

    education: (items) => ({
      type: "education",
      title: ui.sections.education,
      count: items.length,
      kind: "rows",
      rows: byDateDesc(items, "from_date").map((it) => ({
        period: period(it.from_date, it.to_date),
        main: [t(it.affiliation), t(it.department)].filter(Boolean).join(" "),
        sub: t(it.course),
      })),
    }),

    awards: (items) => ({
      type: "awards",
      title: ui.sections.awards,
      count: items.length,
      kind: "items",
      items: byDateDesc(items, "award_date").map((a) => ({
        title: t(a.award_name),
        meta: [t(a.association), fmtDate(a.award_date)].filter(Boolean),
        badges: [],
        links: [],
      })),
    }),

    published_papers: (items) => ({
      type: "published_papers",
      title: ui.sections.published_papers,
      count: items.length,
      kind: "items",
      items: byDateDesc(items, "publication_date").map((p) => {
        const journal = [
          t(p.publication_name),
          p.volume,
          p.number ? `(${p.number})` : "",
        ]
          .filter(Boolean)
          .join(" ");
        const pages = p.starting_page
          ? `pp.${p.starting_page}${p.ending_page ? `–${p.ending_page}` : ""}`
          : "";
        const badges: string[] = [];
        if (p.referee) badges.push(ui.refereed);
        const type = ui.paperType[p.published_paper_type];
        if (type) badges.push(type);
        return {
          title: t(p.paper_title),
          sub: names(p.authors),
          meta: [
            [journal, pages].filter(Boolean).join(" "),
            fmtDate(p.publication_date),
          ].filter(Boolean),
          badges,
          links: externalLinks(p),
        };
      }),
    }),

    presentations: (items) => ({
      type: "presentations",
      title: ui.sections.presentations,
      count: items.length,
      kind: "items",
      items: byDateDesc(items, "publication_date").map((p) => {
        const badges: string[] = [];
        const type = ui.presentationType[p.presentation_type];
        if (type) badges.push(type);
        if (p.invited) badges.push(ui.invited);
        return {
          title: t(p.presentation_title),
          sub: names(p.presenters),
          meta: [
            t(p.event),
            fmtDate(p.publication_date ?? p.from_event_date),
          ].filter(Boolean),
          badges,
          links: externalLinks(p),
        };
      }),
    }),

    research_projects: (items) => ({
      type: "research_projects",
      title: ui.sections.research_projects,
      count: items.length,
      kind: "items",
      items: byDateDesc(items, "from_date").map((p) => ({
        title: t(p.research_project_title),
        meta: [
          [t(p.offer_organization), t(p.system_name)].filter(Boolean).join(" "),
          period(p.from_date, p.to_date),
        ].filter(Boolean),
        badges: [],
        links: [],
      })),
    }),

    association_memberships: (items) => ({
      type: "association_memberships",
      title: ui.sections.association_memberships,
      count: items.length,
      kind: "rows",
      rows: byDateDesc(items, "from_date").map((it) => ({
        period: period(it.from_date, it.to_date),
        main: t(it.academic_society_name),
      })),
    }),

    academic_contribution: (items) =>
      genericItems(
        items,
        "academic_contribution",
        "academic_contribution_title",
      ),
    social_contribution: (items) =>
      genericItems(items, "social_contribution", "social_contribution_title"),
    others: (items) => genericItems(items, "others", "other_title"),
  };

  function genericItems(
    items: any[],
    type: string,
    titleKey: string,
  ): SectionView {
    return {
      type,
      title: ui.sections[type],
      count: items.length,
      kind: "items",
      items: byDateDesc(items, "from_date").map((it) => ({
        title: t(it[titleKey]),
        meta: [
          t(it.event),
          period(it.from_date, it.to_date) || fmtDate(it.publication_date),
        ].filter(Boolean),
        badges: [],
        links: [],
      })),
    };
  }

  return Object.entries(builders)
    .map(([type, build]) => {
      const items = sections[type];
      if (!items?.length) return null;
      const view = build(items);
      if (view && !NO_COUNT.has(type)) view.count = items.length;
      return view;
    })
    .filter((v): v is SectionView => v != null);
}
