import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Builds the static documentation site entrypoint.
 *
 * @returns {Promise<void>} Promise resolved when the static page is generated
 * @example
 * await main();
 * @since 0.1.0
 * @category Docs
 */
async function main(): Promise<void> {
  const docsDirectory = join(process.cwd(), 'docs-site');
  const metricsPath = join(docsDirectory, 'data', 'metrics.json');
  const metrics = JSON.parse(await readFile(metricsPath, 'utf8')) as {
    coverage: { functions: number; lines: number };
    tests: { passed: number; failed: number };
  };

  await mkdir(docsDirectory, { recursive: true });
  await writeFile(
    join(docsDirectory, 'index.html'),
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
    </style>
  </head>
  <body>
    <h1>AI-Coding-Sync Documentation</h1>
    <div class="card">
      <h2>Published API Docs</h2>
      <p>The generated TypeDoc site is available in the <code>docs/</code> artifact.</p>
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
