import { readFileSync } from "node:fs";
import ts from "typescript";

const tsHost = ts.createCompilerHost(
  {
    allowJs: true,
    noEmit: true,
    isolatedModules: true,
    resolveJsonModule: false,
    moduleResolution: ts.ModuleResolutionKind.Classic, // we don't want node_modules
    incremental: true,
    noLib: true,
    noResolve: true,
  },
  true,
);

function delintNode(node) {
  if (!ts.isImportDeclaration(node)) {
    ts.forEachChild(node, delintNode);
    return;
  }

  const named = node.importClause?.namedBindings?.elements || [];
  const name = node.importClause?.name?.escapedText;
  const nname = node.importClause?.namedBindings?.name?.escapedText;
  const from = node.moduleSpecifier.text;
  const typeonly = node.importClause?.isTypeOnly;

  if (name) {
    console.log(typeonly ? "import type" : "import", name, "from", `'${from}';`);
  }

  if (nname) {
    console.log("import * as", nname, "from", `'${from}';`);
  }

  named.forEach(({ name, propertyName, isTypeOnly }) => {
    console.log(
      typeonly || isTypeOnly ? "import { type" : "import {",
      propertyName
        ? `${propertyName.escapedText} as ${name.escapedText}`
        : name.escapedText,
      "} from",
      `'${from}';`,
    );
  });

  if (!name && !nname && !named.length) {
    console.log("import", `'${from}';`);
  }
}

function getImports(fileName) {
  const sourceFile = tsHost.getSourceFile(
    fileName,
    ts.ScriptTarget.Latest,
    (msg) => {
      throw new Error(`Failed to parse ${fileName}: ${msg}`);
    },
  );

  if (!sourceFile) {
    throw ReferenceError(`Failed to find file ${fileName}`);
  }

  delintNode(sourceFile);
}

getImports(process.argv[2]);
