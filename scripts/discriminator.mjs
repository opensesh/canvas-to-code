#!/usr/bin/env node
// discriminator.mjs — Detect the source type AND shape of a design export.
//
// Two shapes:
//   - 'iter' — a folder containing source-meta.yaml with metaVersion: 2.
//              The yaml's `source:` field is authoritative for type.
//   - 'flat' — a folder with review.html (or screenshots-only). Type is
//              inferred from the first 2 KB of review.html using signature
//              matching, or from screenshot/empty-folder fallbacks.
//
// Source types: paper | claude-design | figma | v0 | lovable | webflow |
//               screenshot-only | generic-html
//
// Usage:
//   node scripts/discriminator.mjs <feature-or-iter-dir>
//   import { detectSourceType } from './discriminator.mjs'
//
// CLI exit codes: 0 always; output goes to stdout.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SAMPLE_BYTES = 2048;

const VALID_SOURCES = new Set([
  'paper',
  'claude-design',
  'figma',
  'v0',
  'lovable',
  'webflow',
  'screenshot-only',
  'generic-html',
]);

const SIGNATURES = [
  {
    type: 'claude-design',
    match: (sample) => /<script\b[^>]*\btype=["']__bundler\/template["']/i.test(sample),
  },
  {
    type: 'figma',
    match: (sample) => /\bdata-figma-[a-z-]+/.test(sample) || /<meta[^>]+content=["'][^"']*figma\.com/i.test(sample),
  },
  {
    type: 'lovable',
    match: (sample) => /lovable\.dev/i.test(sample),
  },
  {
    type: 'webflow',
    match: (sample) => /<link\b[^>]+href=["'][^"']*\.webflow\.css/i.test(sample) || /\bdata-wf-[a-z-]+/.test(sample),
  },
];

/**
 * Parse a flat top-level YAML block. Handles scalar values, single/double-quoted
 * strings, and inline `# comment` trailers. Block scalars and nested maps are not
 * required for source-meta v2's seven top-level required fields.
 */
export function parseSimpleYaml(text) {
  const out = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\s+#.*$/, '');
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*?)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2];
    if (value === '' || value === '|' || value === '>') continue; // block scalar — skip body
    value = value.replace(/^['"]|['"]$/g, '');
    out[key] = value;
  }
  return out;
}

/**
 * Detect source type AND shape from a directory.
 * @param {string} dir - absolute path to either a feature folder or an iter folder
 * @returns {{ type: string, shape: 'iter' | 'flat', signal: string | null }}
 */
export function detectSourceType(dir) {
  if (!existsSync(dir)) {
    return { type: 'generic-html', shape: 'flat', signal: 'feature-dir-missing' };
  }

  // Iter shape: source-meta.yaml with metaVersion: 2 at the dir root.
  const metaPath = join(dir, 'source-meta.yaml');
  if (existsSync(metaPath) && statSync(metaPath).size > 0) {
    const yaml = parseSimpleYaml(readFileSync(metaPath, 'utf8'));
    if (String(yaml.metaVersion) === '2') {
      const declared = (yaml.source || '').trim();
      if (VALID_SOURCES.has(declared)) {
        return { type: declared, shape: 'iter', signal: 'source-meta v2' };
      }
      return { type: 'generic-html', shape: 'iter', signal: `source-meta v2 but unknown source: '${declared}'` };
    }
    // metaVersion present but not 2 → reject loudly (callers can map to a Gate 1 backfill hint)
    if (yaml.metaVersion != null) {
      return { type: 'generic-html', shape: 'flat', signal: `unsupported metaVersion: ${yaml.metaVersion}` };
    }
    // No metaVersion → fall through to flat-shape detection
  }

  // Flat shape from here on.
  const reviewPath = join(dir, 'review.html');
  const hasReview = existsSync(reviewPath) && statSync(reviewPath).size > 0;

  if (!hasReview) {
    const screenshotsDir = join(dir, 'screenshots');
    if (existsSync(screenshotsDir)) {
      const pngs = readdirSync(screenshotsDir).filter((f) => f.toLowerCase().endsWith('.png'));
      if (pngs.length > 0) {
        return { type: 'screenshot-only', shape: 'flat', signal: `${pngs.length} png(s); no review.html` };
      }
    }
    return { type: 'generic-html', shape: 'flat', signal: 'no review.html; no screenshots' };
  }

  if (/\.(tsx|jsx)$/i.test(reviewPath)) {
    return { type: 'v0', shape: 'flat', signal: 'filename ends .tsx/.jsx' };
  }

  const fd = readFileSync(reviewPath);
  const sample = fd.slice(0, SAMPLE_BYTES).toString('utf8');

  if (/\/\/\s*v0(\.dev)?\b/i.test(sample) || /<!--\s*v0/i.test(sample)) {
    return { type: 'v0', shape: 'flat', signal: 'v0 marker in head' };
  }

  for (const sig of SIGNATURES) {
    if (sig.match(sample)) {
      return { type: sig.type, shape: 'flat', signal: `signature matched: ${sig.type}` };
    }
  }

  return { type: 'generic-html', shape: 'flat', signal: 'no signature matched' };
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: node discriminator.mjs <feature-or-iter-dir>');
    process.exit(2);
  }
  const result = detectSourceType(target);
  console.log(JSON.stringify(result));
}
