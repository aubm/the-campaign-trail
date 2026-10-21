/** Keep internal URLs inside the current deployment, including PR previews. */
export function createPaths(base = "/") {
  const prefix = base.replace(/\/$/, "");
  const stripBase = (path) => {
    if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) {
      return path.slice(prefix.length) || "/";
    }
    return path;
  };
  const withBase = (path) => {
    if (!path.startsWith("/") || path.startsWith("//")) return path;
    return `${prefix}${stripBase(path)}`;
  };
  // Only rewrite root-relative candidates; leave remote/data URLs untouched.
  const withBaseSrcset = (srcset) =>
    srcset?.replace(
      /(^|,\s*)(\/[^\s,]+)(?=\s|,|$)/g,
      (_, separator, path) => `${separator}${withBase(path)}`,
    );
  return { stripBase, withBase, withBaseSrcset };
}
