import { createPaths } from "../src/lib/base-path.mjs";

/** Prefix Markdown links and images, including the chapters' raw HTML figures. */
export default function markdownBase(base) {
  const { withBase, withBaseSrcset } = createPaths(base);
  return {
    name: `deployment-urls:${base}`,
    element: {
      filter: [],
      visit(node, context) {
        for (const key of ["href", "src", "poster"]) {
          if (typeof node.properties?.[key] === "string") {
            context.setProperty(node, key, withBase(node.properties[key]));
          }
        }
        if (typeof node.properties?.srcSet === "string") {
          context.setProperty(
            node,
            "srcSet",
            withBaseSrcset(node.properties.srcSet),
          );
        }
      },
    },
    raw(node) {
      return {
        ...node,
        value: node.value.replace(
          /\b(href|src|poster|srcset)=("[^"]*"|'[^']*')/gi,
          (_, name, quoted) => {
            const rewrite =
              name.toLowerCase() === "srcset" ? withBaseSrcset : withBase;
            return `${name}=${quoted[0]}${rewrite(quoted.slice(1, -1))}${quoted[0]}`;
          },
        ),
      };
    },
  };
}
