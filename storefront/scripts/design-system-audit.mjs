import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { collectDesignSystemMetrics } from './design-system-metrics.mjs';

const root = path.resolve('src');
const baseline = JSON.parse(
  readFileSync(path.resolve('scripts/design-system-baseline.json'), 'utf8')
);
const sourceOfTruthFiles = new Set([
  path.normalize('src/styles/tokens.css'),
  path.normalize('src/app/globals.css'),
]);
const allowedRawHexFiles = new Set([
  path.normalize('src/styles/tokens.css'),
]);
const allowedImportantFiles = new Set([
  // Required to honor reduced-motion preferences against component animations.
  path.normalize('src/styles/animations.css'),
]);
const allowedLegacyFontFiles = new Set([
  // Compatibility selectors only. Runtime markup should use font-display/font-body.
  path.normalize('src/styles/utilities.css'),
  path.normalize('src/app/globals.css'),
]);
const checkedExtensions = new Set(['.css', '.ts', '.tsx']);
const defaultPalettePattern =
  /\b(?:text|bg|border|ring|fill|stroke|placeholder|from|via|to|decoration|divide|accent)-(?:white|black|stone|neutral|zinc|gray|slate|amber|rose|emerald|blue|green|red|yellow|pink|purple)(?:-[0-9]{2,3})?(?:\/[0-9]{1,3})?\b/g;
const allowedInlineStylePatterns = [
  /style=\{\{\s*animationDelay:/,
  /style=\{\{\s*width:\s*`/,
  /style=\{\{\s*width:\s*workflowIndex/,
  /style=\{\{\s*background:\s*getColorHex/,
  /style=\{\{\s*backgroundColor:\s*category\.iconBg/,
  /style=\{\{\s*animationDuration:\s*speed/,
  /<PayPalButtons/,
  /layout:\s*'vertical'/,
  /color:\s*'black'/,
  /shape:\s*'rect'/,
  /label:\s*'pay'/,
  /height:\s*48/,
];

const findings = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!checkedExtensions.has(path.extname(entry.name))) continue;
    auditFile(fullPath);
  }
}

function auditFile(fullPath) {
  const rel = path.normalize(path.relative(process.cwd(), fullPath));
  const ext = path.extname(rel);
  const text = readFileSync(fullPath, 'utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const location = `${rel}:${index + 1}`;

    if (/#[0-9a-f]{3,8}\b/i.test(line) && !allowedRawHexFiles.has(rel)) {
      findings.push(`${location} raw hex should be a --ds-* token`);
    }

    if (/!important/.test(line) && !allowedImportantFiles.has(rel)) {
      findings.push(`${location} avoid !important outside documented accessibility exceptions`);
    }

    if (/\bfont-(serif|heading)\b/.test(line) && !allowedLegacyFontFiles.has(rel)) {
      findings.push(`${location} legacy font utility should use font-display or font-body`);
    }

    if (/[Ãâ�]/.test(line)) {
      findings.push(`${location} likely mojibake/encoding artifact in UI source`);
    }

    if (/\b(sienna|coral)\b/i.test(line) && !sourceOfTruthFiles.has(rel)) {
      findings.push(`${location} legacy sienna/coral naming is superseded by TERRACOTTA`);
    }

    if (defaultPalettePattern.test(line)) {
      findings.push(`${location} default Tailwind palette utility should use --ds-* tokens`);
      defaultPalettePattern.lastIndex = 0;
    }

    if (
      ext === '.tsx' &&
      /\b(account-primary-action|account-secondary-action|content-button|search-empty-action)\b/.test(line)
    ) {
      findings.push(`${location} local CTA class should use Button, ButtonLink, or ButtonAnchor`);
    }

    if (/style=\{\{/.test(line)) {
      const allowed =
        rel === path.normalize('src/components/checkout/PayPalButton.tsx') ||
        allowedInlineStylePatterns.some((pattern) => pattern.test(line));
      if (!allowed) {
        findings.push(`${location} inline style needs an audit allowlist entry or a class/token replacement`);
      }
    }

    const selfReference = line.match(/(--ds-[a-z0-9-]+):\s*var\(\1\)/i);
    if (selfReference) {
      findings.push(`${location} design token cannot self-reference itself`);
    }
  });
}

walk(root);

const metrics = collectDesignSystemMetrics();

if (metrics.nativeStyledButtons > baseline.nativeStyledButtons) {
  findings.push(
    `P0 ratchet: native styled buttons increased from ${baseline.nativeStyledButtons} to ${metrics.nativeStyledButtons}. Use src/components/ui/Button.tsx or reduce the baseline after migration.`
  );
}

if (metrics.defaultPaletteRefs > baseline.defaultPaletteRefs) {
  findings.push(
    `P0 ratchet: default Tailwind palette refs increased from ${baseline.defaultPaletteRefs} to ${metrics.defaultPaletteRefs}. Use --ds-* tokens or reduce the baseline after migration.`
  );
}

if (metrics.uiDefaultPaletteRefs > baseline.uiDefaultPaletteRefs) {
  findings.push(
    `P0 ratchet: default palette refs in src/components/ui increased from ${baseline.uiDefaultPaletteRefs} to ${metrics.uiDefaultPaletteRefs}. Shared primitives should use explicit --ds-* tokens.`
  );
}

if (findings.length) {
  console.error('Design system audit failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Design system audit passed: tokens, legacy accent names, and override usage are consistent.');
