import { createAcrylicComparison } from "./three/acrylic-comparison";

createAcrylicComparison();
// @ts-expect-error The existing application remains intentionally untyped during this isolated renderer migration.
await import("../script.js");
