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

function debug(o) {
  const o2 = { ...o };
  delete o2.attributes;
  delete o2.end;
  delete o2.flags;
  delete o2.importClause;
  delete o2.jsDoc;
  delete o2.kind;
  delete o2.localSymbol;
  delete o2.modifierFlagsCache;
  delete o2.modifiers;
  delete o2.moduleSpecifier;
  delete o2.namedBindings;
  delete o2.parent;
  delete o2.pos;
  delete o2.symbol;
  delete o2.transformFlags;
  return o2;
}

function delintNode(node) {
  if (!ts.isImportDeclaration(node)) {
    ts.forEachChild(node, delintNode);
    return;
  }

  console.log("");
  console.log("");
  console.log("node", debug(node));
  console.log(".importClause", debug(node.importClause));
  console.log("..namedBindings", debug(node.importClause?.namedBindings));
  console.log(".moduleSpecifier", debug(node.moduleSpecifier));
  console.log("");

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
    console.log("");
    named.forEach((n, i) => console.log(`...elements[${i}]`, debug(n)));
    console.log("");

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
