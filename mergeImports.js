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

function delintNode(node, out) {
  if (!ts.isImportDeclaration(node)) {
    ts.forEachChild(node, (n) => delintNode(n, out));
    return;
  }

  const named = node.importClause?.namedBindings?.elements || [];
  const name = node.importClause?.name?.escapedText;
  const nname = node.importClause?.namedBindings?.name?.escapedText;
  const from = node.moduleSpecifier.text;
  const typeonly = node.importClause?.isTypeOnly;
  const nameds = named.map(({ name, propertyName, isTypeOnly }) => ({
    name: name.escapedText,
    prop: propertyName?.escapedText,
    isTypeOnly,
  }));

  out[from] ||= [];
  out[from].push({ name, typeonly, nname, nameds });
}

function output(out) {
  Object.entries(out).forEach(([from, entries]) => {
    entries.forEach(({ name, typeonly, nname, nameds }) => {
      // TODO try to output all entris with the same from as one import
      if (name) {
        console.log(
          typeonly ? "import type" : "import",
          name,
          "from",
          `'${from}';`,
        );
      }

      if (nname) {
        console.log("import * as", nname, "from", `'${from}';`);
      }

      nameds.forEach(({ name, prop, isTypeOnly }) => {
        console.log(
          typeonly || isTypeOnly ? "import { type" : "import {",
          prop ? `${prop} as ${name}` : name,
          "} from",
          `'${from}';`,
        );
      });

      if (!name && !nname && !nameds.length) {
        console.log("import", `'${from}';`);
      }
    });
  });
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

  const out = {};
  delintNode(sourceFile, out);
  output(out);
}

getImports(process.argv[2]);
