#!/usr/bin/env node

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

const poscache = { breaks: [], name: "" };

function pos2line(pos) {
  const { breaks, name } = poscache;
  for (let i = 0; i < breaks.length; i++) {
    // if first break = 5; pos = 2 should ret 1, pos = 6 should ret 2
    if (pos < breaks[i]) {
      return i + 1;
    }
  }
  return breaks.length + 1;
}

function delintNode(node) {
  if (!ts.isImportDeclaration(node)) {
    ts.forEachChild(node, delintNode);
    return;
  }

  const { importClause, moduleSpecifier, pos } = node;
  const named = importClause?.namedBindings?.elements || [];
  const name = importClause?.name?.escapedText;
  const nname = importClause?.namedBindings?.name?.escapedText;
  const from = moduleSpecifier.text;
  const typeonly = importClause?.isTypeOnly;

  if (name) {
    console.log(
      `${poscache.name}:${pos2line(pos)}:`,
      typeonly ? "import type" : "import",
      name,
      "from",
      `'${from}';`,
    );
  }

  if (nname) {
    console.log(
      `${poscache.name}:${pos2line(pos)}:`,
      "import * as",
      nname,
      "from",
      `'${from}';`,
    );
  }

  named.forEach(({ name, propertyName, isTypeOnly, pos }) => {
    console.log(
      `${poscache.name}:${pos2line(pos)}:`,
      typeonly || isTypeOnly ? "import { type" : "import {",
      propertyName
        ? `${propertyName.escapedText} as ${name.escapedText}`
        : name.escapedText,
      "} from",
      `'${from}';`,
    );
  });

  if (!name && !nname && !named.length) {
    console.log(`${poscache.name}:${pos2line(pos)}:`, "import", `'${from}';`);
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

  poscache.name = fileName;
  poscache.breaks = [...sourceFile.text.matchAll(/\n/g)].map(
    ({ index }) => index,
  );
  delintNode(sourceFile);
}

const [_node, _split, ...files] = process.argv;
files.forEach((name) => {
  if (files.length) {
    console.log(`// ${name}:`);
  }

  try {
    getImports(name);
  } catch (e) {
    console.error(e);
  }
});
