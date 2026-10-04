/** Public address of the site, used for links in robots.txt, the sitemap and share previews. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
