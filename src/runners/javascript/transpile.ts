import { transform } from 'sucrase';
import ts from 'typescript';

export class ModuleNotSupportedError extends Error {
  constructor() {
    super('Package imports and require() are not supported in code challenges.');
    this.name = 'ModuleNotSupportedError';
  }
}

function rejectModules(code: string): void {
  const source = ts.createSourceFile('challenge.ts', code, ts.ScriptTarget.Latest, true);
  let hasModuleSyntax = false;

  function visit(node: ts.Node) {
    if (
      ts.isImportDeclaration(node) ||
      ts.isExportDeclaration(node) ||
      ts.isImportEqualsDeclaration(node) ||
      (ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) && node.expression.text === 'require')))
    ) {
      hasModuleSyntax = true;
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  if (hasModuleSyntax) throw new ModuleNotSupportedError();
}

export function transpileCode(language: string, code: string): string {
  rejectModules(code);

  if (language === 'javascript') return code;
  if (language === 'typescript') {
    return transform(code, { transforms: ['typescript'], filePath: 'challenge.ts' }).code;
  }

  throw new Error(`Unsupported code language: ${language}`);
}