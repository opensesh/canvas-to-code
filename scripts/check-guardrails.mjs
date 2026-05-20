#!/usr/bin/env node
// check-guardrails.mjs — detect the 7 guardrail violations in a diff string.
//
// Used by:
//   - hooks/pre-commit-guardrails.sh (passes the staged diff via stdin)
//   - tests/09-guardrail-detection.test.mjs
//   - canvas-to-code-guardrails skill (informational only)
//
// Modes:
//   --stdin --format text   → reads diff from stdin, prints one finding per line, exit 0 if clean, 1 if findings.
//   --stdin --format json   → emits JSON aggregated counts.
//
// Diff format expected: standard `git diff` (unified). Only `+` lines are checked.

import { readFileSync } from 'node:fs';

const RULES = [
  {
    name: 'devProps',
    description: 'function name and devProps string must match exactly',
    // Heuristic: function declaration immediately followed (within 10 lines below)
    // by devProps('OtherName'). Detected during file-level scan, not line-level.
    // For diff scanning we approximate: any +line containing `devProps('X')` where
    // we can't verify name match — flag as needs-review if file-level context absent.
    // For the simple test harness, we count `devProps(` calls that look mismatched.
    pattern: null, // detected via scanFileLevel
  },
  {
    name: 'border-2',
    description: 'use `border` (1px) instead of `border-2`',
    pattern: /\bborder-(2|4|8)\b/,
  },
  {
    name: 'ring-2',
    description: 'use `ring-1 + shadow-focus-ring`',
    pattern: /\bring-(2|4)\b/,
  },
  {
    name: 'raw-hex',
    description: 'no raw hex in JSX (use Style 2 mapped class)',
    // Hex literals inside className or style attributes
    pattern: /(className|class|style)=[^>]*#[0-9a-fA-F]{3,8}\b/,
  },
  {
    name: 'array-index-keys',
    description: 'use a stable id, not the array index',
    pattern: /\bkey=\{(i|idx|index)\}/,
  },
  {
    name: 'style-1-vars',
    description: 'no bg-[var(--…)] — use Style 2 mapped classes',
    pattern: /(bg|text|border|ring|shadow)-\[var\(--[^\)]+\)\]/,
  },
  {
    name: 'uui-first-skipped',
    description: 'building a primitive that should come from components/base/',
    // Heuristic only — flagged when a +line declares a known-primitive name as a function.
    pattern: /^\+\s*export\s+function\s+(Button|Tabs|Tab|TabPanel|Modal|Dialog|Avatar|Badge|Tooltip)\s*\(/,
  },
];

/**
 * Scan a unified diff string and return findings.
 * @param {string} diff
 * @returns {{ rule: string, file: string, line: number, content: string }[]}
 */
export function checkGuardrails(diff) {
  const findings = [];
  const files = parseDiff(diff);

  for (const file of files) {
    // Per-rule line scans
    for (const rule of RULES) {
      if (!rule.pattern) continue;
      for (const { lineNo, content } of file.addedLines) {
        if (rule.pattern.test(content)) {
          findings.push({ rule: rule.name, file: file.path, line: lineNo, content: content.trim() });
        }
      }
    }
    // devProps name-match check (file-level heuristic)
    findings.push(...checkDevPropsMatch(file));
  }

  return findings;
}

/**
 * Parse a unified diff into per-file structures with line numbers.
 */
function parseDiff(diff) {
  const files = [];
  const lines = diff.split('\n');
  let current = null;
  let newLineNo = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (fileMatch) {
      current = { path: fileMatch[1], addedLines: [] };
      files.push(current);
      newLineNo = 0;
      continue;
    }
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      newLineNo = parseInt(hunkMatch[1], 10) - 1;
      continue;
    }
    if (!current) continue;
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    if (line.startsWith('+')) {
      newLineNo++;
      current.addedLines.push({ lineNo: newLineNo, content: line.slice(1) });
    } else if (line.startsWith('-')) {
      // removed lines don't advance newLineNo
    } else if (line.startsWith(' ')) {
      newLineNo++;
    }
  }

  return files;
}

/**
 * Heuristic devProps match check. Flags when an added function declaration
 * has a devProps('Other') call within 10 lines below with a non-matching name.
 */
function checkDevPropsMatch(file) {
  const findings = [];
  const fnRe = /^\s*export\s+function\s+([A-Z][A-Za-z0-9_]*)\s*\(/;
  const devRe = /devProps\(['"]([A-Z][A-Za-z0-9_]*)['"]\)/;
  const added = file.addedLines;

  for (let i = 0; i < added.length; i++) {
    const m = added[i].content.match(fnRe);
    if (!m) continue;
    const fnName = m[1];
    for (let j = i + 1; j < Math.min(i + 10, added.length); j++) {
      const d = added[j].content.match(devRe);
      if (d && d[1] !== fnName) {
        findings.push({
          rule: 'devProps',
          file: file.path,
          line: added[j].lineNo,
          content: `function ${fnName}() ... devProps('${d[1]}') — name mismatch`,
        });
        break;
      }
    }
  }

  return findings;
}

/**
 * Aggregate findings by rule.
 */
export function aggregate(findings) {
  const counts = {};
  for (const rule of RULES) counts[rule.name] = 0;
  for (const f of findings) counts[f.rule] = (counts[f.rule] || 0) + 1;
  return counts;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const stdin = args.includes('--stdin');
  const formatArg = args.indexOf('--format');
  const format = formatArg >= 0 ? args[formatArg + 1] : 'text';

  let diff = '';
  if (stdin) {
    diff = readFileSync(0, 'utf8');
  } else {
    const filePath = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--format');
    if (!filePath) {
      console.error('usage: node check-guardrails.mjs --stdin [--format text|json]   OR   node check-guardrails.mjs <diff-file>');
      process.exit(2);
    }
    diff = readFileSync(filePath, 'utf8');
  }

  const findings = checkGuardrails(diff);

  if (format === 'json') {
    console.log(JSON.stringify({ findings, counts: aggregate(findings) }, null, 2));
  } else {
    for (const f of findings) {
      console.log(`${f.rule}:${f.file}:${f.line}:${f.content}`);
    }
  }

  process.exit(findings.length > 0 ? 1 : 0);
}
