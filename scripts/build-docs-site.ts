import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Metrics consumed by the published docs landing page.
 *
 * @typedef {Object} DocsMetrics
 * @property {{functions: number, lines: number}} coverage - Coverage summary values
 * @property {{passed: number, failed: number}} tests - Test execution summary
 * @since 0.1.0
 * @category Docs
 */
type DocsMetrics = {
  coverage: { functions: number; lines: number };
  tests: { passed: number; failed: number };
};

/**
 * Copies the generated TypeDoc output into the published docs site.
 *
 * @param {string} sourceDirectory - Directory containing generated TypeDoc files
 * @param {string} targetDirectory - Directory where published API docs should be placed
 * @returns {Promise<void>} Promise resolved when the API docs are copied
 * @example
 * await copyApiDocs('/project/docs', '/project/docs-site/api');
 * @since 0.1.0
 * @category Docs
 */
async function copyApiDocs(
  sourceDirectory: string,
  targetDirectory: string
): Promise<void> {
  await mkdir(targetDirectory, { recursive: true });
  await cp(sourceDirectory, targetDirectory, { recursive: true });
}

/**
 * Builds the static documentation site entrypoint.
 *
 * Copies the generated TypeDoc site into the published artifact so GitHub Pages
 * serves both the landing page and the full API reference.
 *
 * @returns {Promise<void>} Promise resolved when the static page is generated
 * @example
 * await main();
 * @since 0.1.0
 * @category Docs
 */
async function main(): Promise<void> {
  const rootDirectory = process.cwd();
  const docsDirectory = join(rootDirectory, 'docs');
  const docsSiteDirectory = join(rootDirectory, 'docs-site');
  const metricsPath = join(docsSiteDirectory, 'data', 'metrics.json');
  const apiOutputDirectory = join(docsSiteDirectory, 'api');
  const metrics = JSON.parse(
    await readFile(metricsPath, 'utf8')
  ) as DocsMetrics;

  await mkdir(docsSiteDirectory, { recursive: true });
  await copyApiDocs(docsDirectory, apiOutputDirectory);
  await writeFile(
    join(docsSiteDirectory, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI-Coding-Sync Documentation</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.5; }
      .card { border: 1px solid #ddd; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; }
      code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 4px; }
      a.button { display: inline-block; margin-top: 0.75rem; padding: 0.6rem 0.9rem; background: #111827; color: white; text-decoration: none; border-radius: 8px; }
    </style>
  </head>
  <body>
    <h1>AI-Coding-Sync Documentation</h1>
    <div class="card">
      <h2>Published API Docs</h2>
      <p>The full TypeDoc site, including JSDoc API references and CLI documentation derived from the README project docs, is published under <code>docs-site/api/</code>.</p>
      <a class="button" href="./api/index.html">Open API and CLI documentation</a>
    </div>
    <div class="card">
      <h2>Coverage</h2>
      <p>Functions: ${metrics.coverage.functions}%</p>
      <p>Lines: ${metrics.coverage.lines}%</p>
    </div>
    <div class="card">
      <h2>Test Results</h2>
      <p>Passed: ${metrics.tests.passed}</p>
      <p>Failed: ${metrics.tests.failed}</p>
    </div>
  </body>
</html>`,
    'utf8'
  );
}

await main();
