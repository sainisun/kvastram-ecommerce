import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const backendRoot = join(root, 'backend', 'src');
const docsRoot = join(root, 'docs', 'architecture');
const sourceExtensions = new Set(['.ts', '.tsx']);
const findings = [];

const boundaries = [
  {
    name: 'contracts',
    directory: join(backendRoot, 'contracts'),
    forbidden: [
      /^\.{1,2}\//,
      /^hono(?:\/|$)/,
      /^drizzle-orm(?:\/|$)/,
      /^postgres(?:\/|$)/,
      /^pg(?:\/|$)/,
    ],
  },
  {
    name: 'domain',
    directory: join(backendRoot, 'domain'),
    forbidden: [
      /^hono(?:\/|$)/,
      /^drizzle-orm(?:\/|$)/,
      /^postgres(?:\/|$)/,
      /^pg(?:\/|$)/,
      /(^|\/)routes(\/|$)/,
      /(^|\/)middleware(\/|$)/,
      /(^|\/)db(\/|$)/,
      /(^|\/)config(\/|$)/,
      /(^|\/)services(\/|$)/,
    ],
  },
  {
    name: 'application',
    directory: join(backendRoot, 'application'),
    forbidden: [
      /^hono(?:\/|$)/,
      /^drizzle-orm(?:\/|$)/,
      /^postgres(?:\/|$)/,
      /^pg(?:\/|$)/,
      /(^|\/)routes(\/|$)/,
      /(^|\/)middleware(\/|$)/,
      /(^|\/)db(\/|$)/,
    ],
  },
];

function walk(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...walk(path));
    } else if (sourceExtensions.has(extname(path))) {
      files.push(path);
    }
  }
  return files;
}

function importsFor(file) {
  const source = readFileSync(file, 'utf8');
  const imports = [];
  const matcher = /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(matcher)) imports.push(match[1]);
  return imports;
}

function resolveRelativeImport(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = resolve(fromFile, '..', specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ];
  return candidates.find(existsSync) ?? null;
}

function isForbidden(specifier, rules) {
  return rules.some((rule) => rule.test(specifier));
}

function validateBoundary(boundary) {
  for (const file of walk(boundary.directory)) {
    for (const specifier of importsFor(file)) {
      if (isForbidden(specifier, boundary.forbidden)) {
        findings.push(
          `[${boundary.name}] ${relative(root, file)} imports prohibited dependency "${specifier}"`
        );
      }
    }
  }
}

function validateCycles() {
  const coreFiles = boundaries.flatMap((boundary) => walk(boundary.directory));
  const coreFileSet = new Set(coreFiles.map(normalize));
  const graph = new Map();

  for (const file of coreFiles) {
    const dependencies = importsFor(file)
      .map((specifier) => resolveRelativeImport(file, specifier))
      .filter((candidate) => candidate && coreFileSet.has(normalize(candidate)))
      .map(normalize);
    graph.set(normalize(file), dependencies);
  }

  const visiting = new Set();
  const visited = new Set();
  const trail = [];

  function visit(node) {
    if (visiting.has(node)) {
      const start = trail.indexOf(node);
      const cycle = [...trail.slice(start), node]
        .map((item) => relative(root, item))
        .join(' -> ');
      findings.push(`[cycle] ${cycle}`);
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node);
    trail.push(node);
    for (const dependency of graph.get(node) ?? []) visit(dependency);
    trail.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const file of graph.keys()) visit(file);
}

function validateRf003Artifacts() {
  const required = [
    join(backendRoot, 'application', 'tags', 'contracts.ts'),
    join(backendRoot, 'application', 'tags', 'tag-service.ts'),
    join(backendRoot, 'repositories', 'tag-repository.ts'),
    join(backendRoot, 'services', 'tag-application-service.ts'),
  ];
  for (const artifact of required) {
    if (!existsSync(artifact)) {
      findings.push(`[rf-003] missing required artifact ${relative(root, artifact)}`);
    }
  }

  const tagsRoute = join(backendRoot, 'routes', 'tags.ts');
  const directDatabaseImport = importsFor(tagsRoute).find(
    (specifier) => /(^|\/)db(?:\/|$)/.test(specifier)
  );
  if (directDatabaseImport) {
    findings.push(
      `[rf-003] ${relative(root, tagsRoute)} imports prohibited persistence dependency "${directDatabaseImport}"`
    );
  }
}

function validateRf005Artifacts() {
  const policy = join(
    backendRoot,
    'domain',
    'orders',
    'order-transition-policy.ts'
  );
  if (!existsSync(policy)) {
    findings.push(`[rf-005] missing required policy ${relative(root, policy)}`);
    return;
  }

  const orderService = join(backendRoot, 'services', 'order-service.ts');
  const serviceSource = readFileSync(orderService, 'utf8');
  if (!serviceSource.includes('assertOrderStatusTransition(')) {
    findings.push('[rf-005] order service does not delegate single-order validation to the transition policy');
  }
  if (!serviceSource.includes('canTransitionOrderStatus(')) {
    findings.push('[rf-005] order service does not delegate bulk validation to the transition policy');
  }
  if (serviceSource.includes('const VALID_TRANSITIONS')) {
    findings.push('[rf-005] order service retains a duplicated transition graph');
  }
}

function validateRf001Artifacts() {
  const required = [
    join(docsRoot, 'README.md'),
    join(docsRoot, 'adr', 'ADR-001-dependency-direction.md'),
    join(docsRoot, 'adr', 'ADR-002-api-contract-and-compatibility.md'),
    join(docsRoot, 'adr', 'ADR-003-schema-modularization-without-data-migration.md'),
    join(docsRoot, 'adr', 'ADR-004-evidence-based-shared-code-extraction.md'),
    join(backendRoot, 'contracts', 'index.ts'),
  ];
  for (const artifact of required) {
    if (!existsSync(artifact)) findings.push(`[rf-001] missing required artifact ${relative(root, artifact)}`);
  }
}

for (const boundary of boundaries) validateBoundary(boundary);
validateCycles();
validateRf001Artifacts();
validateRf003Artifacts();
validateRf005Artifacts();

if (findings.length) {
  console.error('Architecture boundary check failed:');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log('Architecture boundary check passed.');
