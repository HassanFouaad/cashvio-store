import { existsSync, readFileSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

// Node's built-in test runner, using the project's existing TypeScript
// compiler. Resolve the same @/ alias as tsconfig without extra packages.
const projectRoot = new URL("../", import.meta.url);

registerHooks({
  resolve(specifier, context, nextResolve) {
    const isAlias = specifier.startsWith("@/");
    const isLocal =
      specifier.startsWith(".") &&
      context.parentURL?.startsWith(projectRoot.href);
    if (isAlias || isLocal) {
      const base = fileURLToPath(
        isAlias
          ? new URL(`src/${specifier.slice(2)}`, projectRoot)
          : new URL(specifier, context.parentURL),
      );
      const candidate = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}/index.ts`,
      ].find((file) => existsSync(file) && statSync(file).isFile());
      if (candidate)
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(projectRoot.href) && /\.tsx?$/.test(url)) {
      const source = ts.transpileModule(
        readFileSync(fileURLToPath(url), "utf8"),
        {
          fileName: fileURLToPath(url),
          compilerOptions: {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            jsx: ts.JsxEmit.ReactJSX,
          },
        },
      ).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
