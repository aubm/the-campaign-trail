import { createPaths } from "./base-path.mjs";

export const { withBase, withBaseSrcset, stripBase } = createPaths(
  import.meta.env.BASE_URL,
);
export const isPreview = import.meta.env.BASE_URL !== "/";
