import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectDesignSystemMetrics } from './design-system-metrics.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const storefrontRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(storefrontRoot, '..');
const roots = [path.join(storefrontRoot, 'src')];
const extraFiles = [
  path.join(storefrontRoot, 'tailwind.config.ts'),
  path.join(workspaceRoot, 'docs/design-system/storefront-design-system-v1.md'),
  path.join(storefrontRoot, 'KVASTRAM_HEADER_DESIGN_SYSTEM.md'),
];
const baseline = JSON.parse(
  readFileSync(path.join(storefrontRoot, 'scripts/design-system-baseline.json'), 'utf8')
);
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
const localCtaClassPattern =
  /\b(account-primary-action|account-secondary-action|content-button|search-empty-action|error-primary-action|error-secondary-action)\b/;
const rawNumericRgbPattern = /rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}/i;
const namedColorDeclarationPattern =
  /\b(?:color|background(?:-color)?|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline-color|text-decoration-color|fill|stroke)\s*:[^;]*(?<![a-z-])(?:white|black)\b/i;
const legacyAccentNamePattern = new RegExp(`\\b(?:${'sien'}${'na'}|${'co'}${'ral'})\\b`, 'i');
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
const tokenSource = readFileSync(path.join(storefrontRoot, 'src/styles/tokens.css'), 'utf8');
const designSystemDoc = readFileSync(
  path.join(workspaceRoot, 'docs/design-system/storefront-design-system-v1.md'),
  'utf8'
);

if (!/--ds-font-display:\s*'Amiri'/.test(tokenSource)) {
  findings.push('Typography contract: --ds-font-display must start with Amiri.');
}
if (!/--ds-font-body:\s*'Cardo'/.test(tokenSource)) {
  findings.push('Typography contract: --ds-font-body must start with Cardo.');
}
if (!designSystemDoc.includes('Amiri') || !designSystemDoc.includes('Cardo')) {
  findings.push('Typography contract: active documentation must match runtime font tokens.');
}

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
  const rel = path.normalize(path.relative(storefrontRoot, fullPath));
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

    if (legacyAccentNamePattern.test(line)) {
      findings.push(`${location} legacy accent naming is superseded by TERRACOTTA`);
    }

    if (defaultPalettePattern.test(line)) {
      findings.push(`${location} default Tailwind palette utility should use --ds-* tokens`);
      defaultPalettePattern.lastIndex = 0;
    }

    if (ext === '.tsx' && localCtaClassPattern.test(line)) {
      findings.push(`${location} local CTA class should use Button, ButtonLink, or ButtonAnchor`);
    }

    if (rawNumericRgbPattern.test(line)) {
      findings.push(`${location} raw rgb/rgba values should use --ds-*-rgb channels`);
    }

    if (ext === '.css' && namedColorDeclarationPattern.test(line)) {
      findings.push(`${location} named white/black color should use a --ds-* token`);
    }

    if (ext === '.css' && /\.legacy-[a-z0-9-]+/i.test(line)) {
      findings.push(`${location} legacy CSS selector should be removed or renamed to the active primitive contract`);
    }

    if (/\b(?:warm-white|kv-white)\b/.test(line)) {
      findings.push(`${location} legacy white alias should use --ds-surface-* or component-scoped paper tokens`);
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

for (const root of roots) walk(root);
for (const file of extraFiles) auditFile(file);

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
