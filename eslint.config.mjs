import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

/**
 * Replaces `next lint`, which Next.js 16 removed.
 *
 * Errors are reserved for rules that catch real defects (hooks rules, parse
 * errors, unsafe patterns). Rules about style or gradual typing warn, so the
 * existing code base lints clean today and can be tightened file by file.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react/no-unescaped-entities": "warn",
      // React Compiler advisories: worth fixing, not build-breaking.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    ignores: [
      ".next/**", "node_modules/**", "mobile/**", "ml-service/**", "eval/**", "public/**",
      ".kilo/**",            // another tool's worktree copies of the project
      "**/*.mongodb.js",     // MongoDB playground scratch files
      "next-env.d.ts", "scripts/e2e/**",
    ],
  },
]

export default eslintConfig
