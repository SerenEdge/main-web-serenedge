/**
 * Props to spread onto an `<a>` so external links open in a new tab, safely.
 * `noopener` stops the new page reaching back into `window.opener`; `noreferrer`
 * also drops the Referer header. Internal paths, in-page anchors, `mailto:` and
 * `tel:` links don't navigate a tab, so they're left alone.
 */
export function externalLinkProps(href: string): { target: string; rel: string } | Record<string, never> {
  if (!/^https?:\/\//.test(href)) return {};
  return { target: "_blank", rel: "noopener noreferrer" };
}
