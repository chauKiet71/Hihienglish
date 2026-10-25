// Jest runs CommonJS; Vite normally supplies this build-time environment object.
const ts = require('typescript');
module.exports = {
  process(source, filename) {
    return {
      code: ts.transpileModule(source.replace(/import\.meta\.env/g, '({})'), {
        fileName: filename,
        compilerOptions: {
          target: ts.ScriptTarget.ES2023,
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
          inlineSourceMap: true,
          inlineSources: true,
        },
      }).outputText,
    };
  },
};
