#!/usr/bin/env node
'use strict';
// goshipit config helper - zero deps, Node >= 18, CommonJS.
// Usage: node config.js --help

const fs = require('fs');
const path = require('path');

// Agent Skills layout: <skill>/scripts/config.js, <skill>/assets/template.md, <skill>/references/
const ROOT = path.resolve(__dirname, '..');
const REF_DIR = path.join(ROOT, 'references');
const TEMPLATE = path.join(ROOT, 'assets', 'template.md');
const REPO_ROOT = path.resolve(ROOT, '..', '..'); // maintainer checkout: <repo>/skills/<skill>/
const REF_FILE_RE = /^checks-[a-o]-.*\.md$/i;

const RE_ALL = /^- \[( |x|X)\] \*\*ALL\*\*/;
const RE_SECTION = /^## \[( |x|X)\] ([A-O]) · (.+?) \((\d+)\)\s*$/;
const RE_ROW = /^- \[( |x|X)\] ([A-Z]\d+[a-z]?) · (.+?)\s*$/;
const RE_CUSTOM_SECTION = /^## \[( |x|X)\] Custom checks/;
const RE_CUSTOM_ROW = /^- \[(x|X)\] (.+)$/;
const RE_REF_ROW = /^\| ([A-Z]\d+[a-z]?)\s*\|/;
const RE_REF_H1 = /^# Category ([A-Z])\s*-\s*(.+)$/;

const DEFAULT_SETTINGS = {
  fix_mode: 'audit-only',
  build: 'no',
  outdated: 'yes',
  design_md: 'no',
  workspaces: 'all',
  max_agents: 5,
};
const ALLOWED = {
  fix_mode: ['audit-only', 'auto-fix'],
  build: ['yes', 'no'],
  outdated: ['yes', 'no'],
  design_md: ['yes', 'no'],
};

class CliError extends Error {
  constructor(msg, code) {
    super(msg);
    this.code = code == null ? 1 : code;
  }
}

const splitLines = (text) => String(text).replace(/^﻿/, '').split(/\r?\n/);
const isTicked = (c) => c === 'x' || c === 'X';
const detectEol = (text) => (/\r\n/.test(text) ? '\r\n' : '\n');

// ---------------------------------------------------------------- references

function cleanSectionName(raw) {
  let s = raw.trim();
  // drop trailing italic notes `_(...)_` and parenthetical notes `(...)`
  let prev;
  do {
    prev = s;
    s = s.replace(/\s*_\([^]*?\)_\s*$/, '').replace(/\s*\([^()]*\)\s*$/, '').trim();
  } while (s !== prev);
  return s;
}

function refCheckText(line) {
  // "| ID | text | P |" -> text (text may contain escaped pipes)
  const body = line.replace(/^\|[^|]*\|/, '');
  const last = body.lastIndexOf('|');
  const inner = last >= 0 ? body.slice(0, last) : body;
  const pSep = inner.lastIndexOf('|');
  return {
    text: (pSep >= 0 ? inner.slice(0, pSep) : inner).trim(),
    priority: pSep >= 0 ? inner.slice(pSep + 1).trim() : '',
  };
}

// Collapse alignment padding around cell delimiters (content untouched).
function compactRow(line) {
  return line.replace(/\s+$/, '').replace(/ {2,}\|/g, ' |').replace(/\| {2,}/g, '| ');
}

function parseReferenceFile(file) {
  const base = path.basename(file);
  const letter = base.charAt(7).toUpperCase();
  const lines = splitLines(fs.readFileSync(file, 'utf8'));
  const cat = { letter, name: letter, file, base, header: null, sep: null, guidance: [], rows: [] };
  let sub = null;
  let pending = null; // heading seen, not yet known if it introduces a table or prose
  const guide = [];
  for (const line of lines) {
    const h1 = line.match(RE_REF_H1);
    if (h1 && cat.name === letter) {
      cat.name = cleanSectionName(h1[2]);
      continue;
    }
    if (/^#\s/.test(line)) continue;
    const h2 = line.match(/^#{2,6}\s+(.+?)\s*$/);
    if (h2) {
      if (pending) guide.push('', `#### ${pending}`, '');
      pending = h2[1];
      continue;
    }
    if (/^\s*\|/.test(line)) {
      if (pending) {
        sub = pending; // heading directly introduces a table
        pending = null;
      }
      const m = line.match(RE_REF_ROW);
      if (m) {
        const { text, priority } = refCheckText(line);
        cat.rows.push({ id: m[1], line: compactRow(line), text, priority, sub });
      } else if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) {
        if (!cat.sep) cat.sep = line.trim();
      } else if (!cat.header) {
        cat.header = line.trim();
      }
      continue;
    }
    if (pending && line.trim() !== '') {
      // heading introduces prose guidance, not a table
      guide.push('', `#### ${pending}`, '');
      pending = null;
      sub = null;
    }
    // attribution blurbs carry no check logic - keep them out of sub-agent context
    if (/^>\s*\*\*Attribution:\*\*/.test(line)) continue;
    guide.push(line.replace(/\s+$/, ''));
  }
  // collapse blank runs, trim edges
  const out = [];
  for (const l of guide) {
    if (l === '' && (out.length === 0 || out[out.length - 1] === '')) continue;
    out.push(l);
  }
  while (out.length && out[out.length - 1] === '') out.pop();
  cat.guidance = out;
  return cat;
}

function loadReferences(dir) {
  dir = dir || REF_DIR;
  let files;
  try {
    files = fs.readdirSync(dir).filter((f) => REF_FILE_RE.test(f)).sort();
  } catch (e) {
    throw new CliError(`cannot read references dir: ${dir} (${e.message})`);
  }
  if (!files.length) throw new CliError(`no checks-*.md found in ${dir}`);
  const cats = files.map((f) => parseReferenceFile(path.join(dir, f)));
  cats.sort((a, b) => a.letter.localeCompare(b.letter));
  const byId = new Map();
  const byLetter = new Map();
  for (const c of cats) {
    byLetter.set(c.letter, c);
    for (const r of c.rows) byId.set(r.id, { ...r, letter: c.letter });
  }
  const total = cats.reduce((n, c) => n + c.rows.length, 0);
  return { cats, byId, byLetter, total };
}

// ---------------------------------------------------------------- config file

function parseFrontmatter(lines) {
  const settings = {};
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length || lines[i].trim() !== '---') return { settings, bodyStart: 0 };
  let j = i + 1;
  for (; j < lines.length; j++) {
    const raw = lines[j];
    if (raw.trim() === '---') break;
    const noComment = raw.replace(/(^|\s)#.*$/, '').trim();
    if (!noComment) continue;
    const m = noComment.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (m) settings[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  if (j >= lines.length) return { settings: {}, bodyStart: 0 }; // unterminated: ignore
  return { settings, bodyStart: j + 1 };
}

// Scan config body into items, tracking the section each line belongs to by position.
function scanConfig(text) {
  const lines = splitLines(text);
  const { settings, bodyStart } = parseFrontmatter(lines);
  const items = [];
  let all = null;
  let current = null; // letter | 'custom' | null
  let customTicked = null;
  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i].trim();
    let m;
    if (all === null && (m = line.match(RE_ALL))) {
      all = isTicked(m[1]);
      items.push({ type: 'all', idx: i, ticked: all });
      continue;
    }
    if ((m = line.match(RE_CUSTOM_SECTION))) {
      current = 'custom';
      customTicked = isTicked(m[1]);
      items.push({ type: 'custom-section', idx: i, ticked: customTicked });
      continue;
    }
    if ((m = line.match(RE_SECTION))) {
      current = m[2];
      items.push({ type: 'section', idx: i, ticked: isTicked(m[1]), letter: m[2], name: m[3], count: Number(m[4]) });
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      current = null;
      continue;
    }
    if ((m = line.match(RE_ROW))) {
      items.push({ type: 'row', idx: i, ticked: isTicked(m[1]), id: m[2], title: m[3], section: current });
      continue;
    }
    if (current === 'custom' && (m = line.match(RE_CUSTOM_ROW))) {
      const t = m[2].trim();
      if (t) items.push({ type: 'custom', idx: i, text: t });
    }
  }
  return { lines, settings, items, all: all === true, customTicked };
}

function normalizeSettings(raw) {
  const s = { ...DEFAULT_SETTINGS };
  for (const k of Object.keys(DEFAULT_SETTINGS)) {
    if (raw[k] == null || raw[k] === '') continue;
    let v = String(raw[k]).trim();
    if (k === 'max_agents') {
      const n = parseInt(v, 10);
      if (Number.isFinite(n) && n >= 1) s.max_agents = Math.min(n, 50);
      continue;
    }
    v = v.toLowerCase();
    if (ALLOWED[k]) {
      if (k !== 'fix_mode') {
        if (['true', 'y', 'on', '1'].includes(v)) v = 'yes';
        if (['false', 'n', 'off', '0'].includes(v)) v = 'no';
      } else {
        v = v.replace(/[_ ]/g, '-');
      }
      if (ALLOWED[k].includes(v)) s[k] = v;
      continue;
    }
    if (k === 'workspaces') s.workspaces = v === 'all' ? 'all' : String(raw[k]).trim().replace(/\s*,\s*/g, ',');
  }
  return s;
}

function parseConfig(text) {
  const scan = scanConfig(text);
  const sections = {};
  const rows = {};
  for (const it of scan.items) {
    if (it.type === 'section' && !(it.letter in sections)) sections[it.letter] = it;
    if (it.type === 'row' && !(it.id in rows)) rows[it.id] = it;
  }
  const custom = scan.customTicked === false ? [] : scan.items.filter((i) => i.type === 'custom').map((i) => i.text);
  return {
    settings: normalizeSettings(scan.settings),
    rawSettings: scan.settings,
    all: scan.all,
    sections,
    rows,
    custom,
    scan,
  };
}

function select(cfg, refs) {
  refs = refs || loadReferences();
  const out = { settings: cfg.settings, sections: {}, custom: cfg.custom, new: [], unknown: [], total: 0 };
  for (const id of Object.keys(cfg.rows)) if (!refs.byId.has(id)) out.unknown.push(id);
  for (const cat of refs.cats) {
    const sec = cfg.sections[cat.letter];
    const secOn = sec ? sec.ticked : true;
    const ids = [];
    for (const r of cat.rows) {
      const row = cfg.rows[r.id];
      if (!row) out.new.push(r.id);
      if (cfg.all) ids.push(r.id);
      else if (secOn && (row ? row.ticked : true)) ids.push(r.id);
    }
    if (ids.length) {
      out.sections[cat.letter] = { name: cat.name, ids };
      out.total += ids.length;
    }
  }
  return out;
}

// ---------------------------------------------------------------- rows

function rows(ids, refs) {
  refs = refs || loadReferences();
  const want = new Set();
  const warnings = [];
  for (const raw of ids) {
    const id = String(raw).trim();
    if (!id) continue;
    const norm = id.charAt(0).toUpperCase() + id.slice(1);
    if (refs.byId.has(norm)) want.add(norm);
    else warnings.push(`warning: unknown check id "${id}"`);
  }
  const blocks = [];
  for (const cat of refs.cats) {
    const picked = cat.rows.filter((r) => want.has(r.id));
    if (!picked.length) continue;
    const out = [`### ${cat.letter} · ${cat.name}`];
    if (cat.guidance.length) out.push('', ...cat.guidance);
    const header = '| ID | Check | P |';
    const sep = '|---|---|---|';
    let sub;
    let first = true;
    for (const r of picked) {
      if (first || r.sub !== sub) {
        out.push('');
        if (r.sub) out.push(`#### ${r.sub}`, '');
        out.push(header, sep);
        sub = r.sub;
        first = false;
      }
      out.push(r.line);
    }
    blocks.push(out.join('\n'));
  }
  return { text: blocks.join('\n\n'), warnings };
}

// ---------------------------------------------------------------- sync

function autoTitle(text) {
  let t = String(text)
    .replace(/_\([^]*?\)_/g, ' ')
    .replace(/`/g, '')
    .replace(/\*\*|__/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\\|/g, '/')
    .replace(/\|/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
  const cut = t.indexOf(' - ');
  if (cut > 0) t = t.slice(0, cut);
  if (t.length > 60) t = t.slice(0, 60).trimEnd();
  return t || 'Untitled check';
}

function sync(text, refs) {
  refs = refs || loadReferences();
  const eol = detectEol(text);
  const cfg = parseConfig(text);
  const lines = cfg.scan.lines.slice();
  const missing = [];
  for (const cat of refs.cats) for (const r of cat.rows) if (!cfg.rows[r.id]) missing.push({ ...r, letter: cat.letter });
  if (!missing.length) return { text, added: [], touched: [] };

  // insertions: map lineIndex -> array of lines to insert AFTER that index
  const inserts = new Map();
  const addAfter = (idx, l) => {
    if (!inserts.has(idx)) inserts.set(idx, []);
    inserts.get(idx).push(l);
  };
  const touched = new Set();
  const newSections = new Map(); // letter -> lines

  for (const r of missing) {
    const sec = cfg.sections[r.letter];
    const line = `- [x] ${r.id} · ${autoTitle(r.text)} (new)`;
    touched.add(r.letter);
    if (!sec) {
      if (!newSections.has(r.letter)) newSections.set(r.letter, []);
      newSections.get(r.letter).push(line);
      continue;
    }
    // last row line within this section block (by position)
    const blockRows = cfg.scan.items.filter((i) => i.type === 'row' && i.section === r.letter && i.idx > sec.idx);
    let anchor = sec.idx;
    for (const br of blockRows) if (br.idx > anchor) anchor = br.idx;
    addAfter(anchor, line);
  }

  // new sections go before Custom checks section, else at end
  if (newSections.size) {
    const customItem = cfg.scan.items.find((i) => i.type === 'custom-section');
    const block = [];
    for (const cat of refs.cats) {
      if (!newSections.has(cat.letter)) continue;
      const ls = newSections.get(cat.letter);
      block.push(`## [x] ${cat.letter} · ${cat.name} (${ls.length})`, ...ls, '');
    }
    if (customItem) {
      for (const l of block) addAfter(customItem.idx - 1, l);
    } else {
      let last = lines.length - 1;
      while (last >= 0 && lines[last].trim() === '') last--;
      addAfter(last, '');
      block.pop();
      for (const l of block) addAfter(last, l);
    }
  }

  const result = [];
  if (inserts.has(-1)) result.push(...inserts.get(-1));
  for (let i = 0; i < lines.length; i++) {
    result.push(lines[i]);
    if (inserts.has(i)) result.push(...inserts.get(i));
  }

  // fix counts for touched sections (count rows in each section block by position)
  const rescan = scanConfig(result.join('\n'));
  for (const it of rescan.items) {
    if (it.type !== 'section' || !touched.has(it.letter)) continue;
    const n = rescan.items.filter((r) => r.type === 'row' && r.section === it.letter && r.idx > it.idx).length;
    result[it.idx] = result[it.idx].replace(/\(\d+\)(\s*)$/, `(${n})$1`);
  }
  // keep overall totals in step with references
  for (let i = 0; i < result.length; i++) {
    if (/^# goshipit checks \(\d+\)\s*$/.test(result[i])) result[i] = result[i].replace(/\(\d+\)/, `(${refs.total})`);
    if (RE_ALL.test(result[i].trim())) result[i] = result[i].replace(/run all \d+ checks/, `run all ${refs.total} checks`);
  }
  return { text: result.join(eol), added: missing.map((m) => m.id), touched: [...touched].sort() };
}

// ---------------------------------------------------------------- init

function init(opts) {
  const dir = path.resolve(opts.dir || process.cwd());
  const target = path.join(dir, 'goshipit.md');
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new CliError(`not a directory: ${dir}`);
  if (fs.existsSync(target) && !opts.force) throw new CliError(`${target} already exists (use --force to overwrite)`);
  let tpl;
  try {
    tpl = fs.readFileSync(TEMPLATE, 'utf8');
  } catch (e) {
    throw new CliError(`cannot read template: ${TEMPLATE} (${e.message})`);
  }
  const off = new Set();
  for (const raw of opts.off || []) {
    const l = String(raw).trim().toUpperCase();
    if (!l) continue;
    if (!/^[A-O]$/.test(l)) throw new CliError(`--off: invalid section "${raw}" (expected letters A-O)`);
    off.add(l);
  }
  const eol = detectEol(tpl);
  const lines = splitLines(tpl).map((line) => {
    const m = line.match(RE_SECTION);
    if (m && off.has(m[2])) return line.replace(/^## \[(x|X)\]/, '## [ ]');
    return line;
  });
  fs.writeFileSync(target, lines.join(eol));
  return target;
}

// ---------------------------------------------------------------- verify

// ---------------------------------------------------------------- SKILL.md (Agent Skills spec)
// https://agentskills.io/specification - only these top-level keys are allowed.
const SKILL_KEYS = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'];

function unquote(v) {
  return v.trim().replace(/^(["'])(.*)\1$/, '$2');
}

// Minimal YAML subset used by SKILL.md: scalars, folded/literal blocks, one-level maps.
function parseSkillFrontmatter(text) {
  const lines = splitLines(text);
  if ((lines[0] || '').trim() !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end < 0) return null;
  const fm = {};
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].trim();
    const block = [];
    while (i + 1 < end && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1].trim() === '')) block.push(lines[++i]);
    if (/^[>|][+-]?$/.test(val)) {
      const parts = block.map((l) => l.trim());
      fm[key] = val[0] === '>' ? parts.filter(Boolean).join(' ') : parts.join('\n').trim();
    } else if (val === '' && block.length) {
      const map = {};
      for (const l of block) {
        const mm = l.trim().match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
        if (mm) map[mm[1]] = unquote(mm[2]);
        else if (l.trim()) map.__invalid = l.trim();
      }
      fm[key] = map;
    } else fm[key] = unquote(val);
  }
  return fm;
}

function validateSkillFrontmatter(fm, dirName) {
  if (!fm) return ['missing or unterminated --- block'];
  const errs = [];
  for (const k of Object.keys(fm)) if (!SKILL_KEYS.includes(k)) errs.push(`unknown key "${k}" (allowed: ${SKILL_KEYS.join(', ')})`);
  const name = fm.name;
  if (typeof name !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) errs.push(`name "${name}" must be 1-64 chars of a-z, 0-9, single hyphens`);
  else if (dirName && name !== dirName) errs.push(`name "${name}" must match directory "${dirName}"`);
  const d = fm.description;
  if (typeof d !== 'string' || !d.length || d.length > 1024) errs.push(`description must be 1-1024 chars (got ${typeof d === 'string' ? d.length : 0})`);
  if (fm.compatibility != null && (typeof fm.compatibility !== 'string' || fm.compatibility.length > 500)) errs.push('compatibility must be a string of at most 500 chars');
  if (fm['allowed-tools'] != null && typeof fm['allowed-tools'] !== 'string') errs.push('allowed-tools must be a space-separated string');
  if (fm.metadata != null) {
    if (typeof fm.metadata !== 'object' || fm.metadata.__invalid) errs.push('metadata must be a flat map of string keys to string values');
  }
  return errs;
}

function verify(refs) {
  refs = refs || loadReferences();
  const errors = [];
  const tplText = fs.readFileSync(TEMPLATE, 'utf8');
  const scan = scanConfig(tplText);
  const table = [];
  const secItems = scan.items.filter((i) => i.type === 'section');
  const seenLetters = secItems.map((s) => s.letter);
  const refLetters = refs.cats.map((c) => c.letter);
  if (seenLetters.join(',') !== refLetters.join(',')) errors.push(`template section order ${seenLetters.join('')} != references ${refLetters.join('')}`);
  for (const cat of refs.cats) {
    const sec = secItems.find((s) => s.letter === cat.letter);
    const refIds = cat.rows.map((r) => r.id);
    const tplRows = sec ? scan.items.filter((i) => i.type === 'row' && i.section === cat.letter && i.idx > sec.idx) : [];
    const tplIds = tplRows.map((r) => r.id);
    let ok = true;
    if (!sec) {
      errors.push(`${cat.letter}: section missing from template`);
      ok = false;
    } else {
      if (tplIds.join(',') !== refIds.join(',')) {
        const miss = refIds.filter((x) => !tplIds.includes(x));
        const extra = tplIds.filter((x) => !refIds.includes(x));
        errors.push(`${cat.letter}: ids/order mismatch` + (miss.length ? ` missing=[${miss}]` : '') + (extra.length ? ` extra=[${extra}]` : '') + (!miss.length && !extra.length ? ' (order)' : ''));
        ok = false;
      }
      if (sec.count !== refIds.length) {
        errors.push(`${cat.letter}: section count (${sec.count}) != ${refIds.length}`);
        ok = false;
      }
      if (sec.name !== cat.name) {
        errors.push(`${cat.letter}: section name "${sec.name}" != reference "${cat.name}"`);
        ok = false;
      }
      if (!sec.ticked) {
        errors.push(`${cat.letter}: section should be ticked by default`);
        ok = false;
      }
      for (const r of tplRows) {
        if (!r.ticked) { errors.push(`${r.id}: row should be ticked by default`); ok = false; }
        if (r.title.length > 60) { errors.push(`${r.id}: title > 60 chars`); ok = false; }
        if (r.title.includes('|')) { errors.push(`${r.id}: title contains pipe`); ok = false; }
      }
    }
    table.push({ cat: cat.letter, name: cat.name, ref: refIds.length, tpl: tplIds.length, ok });
  }
  // rows not inside any section
  for (const r of scan.items) if (r.type === 'row' && !refs.byLetter.has(r.section)) errors.push(`${r.id}: row outside a check section`);
  const header = scan.lines.find((l) => /^# goshipit checks \(\d+\)/.test(l));
  const hN = header ? Number(header.match(/\((\d+)\)/)[1]) : null;
  if (hN !== refs.total) errors.push(`template header count (${hN}) != ${refs.total}`);
  if (scan.items.some((i) => i.type === 'all')) errors.push('template should not have an ALL line (every box is ticked by default)');
  if (!scan.items.some((i) => i.type === 'custom-section')) errors.push('template Custom checks section missing');
  for (const k of Object.keys(DEFAULT_SETTINGS)) if (!(k in scan.settings)) errors.push(`template frontmatter missing "${k}"`);

  // repo files
  const needle = `${refs.total} checks`;
  const skillPath = path.join(ROOT, 'SKILL.md');
  let skillVersion = null;
  if (fs.existsSync(skillPath)) {
    const s = fs.readFileSync(skillPath, 'utf8');
    if (!s.includes(needle)) errors.push(`SKILL.md does not mention "${needle}"`);
    const fm = parseSkillFrontmatter(s);
    for (const e of validateSkillFrontmatter(fm, path.basename(ROOT))) errors.push(`SKILL.md frontmatter: ${e}`);
    skillVersion = (fm && fm.metadata && fm.metadata.version) || null;
    if (!skillVersion) errors.push('SKILL.md frontmatter has no metadata.version');
  } else errors.push('SKILL.md not found');
  const readme = path.join(REPO_ROOT, 'README.md');
  if (fs.existsSync(readme) && !fs.readFileSync(readme, 'utf8').includes(needle)) errors.push(`README.md does not mention "${needle}"`);
  const pkgPath = path.join(REPO_ROOT, 'package.json');
  if (fs.existsSync(pkgPath)) {
    let pkg = null;
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch (e) {
      errors.push(`package.json invalid JSON: ${e.message}`);
    }
    if (pkg) {
      if (!String(pkg.description || '').includes(needle)) errors.push(`package.json description does not mention "${needle}"`);
      if (skillVersion && pkg.version !== skillVersion) errors.push(`package.json version ${pkg.version} != SKILL.md version ${skillVersion}`);
    }
  }
  return { ok: errors.length === 0, errors, table, total: refs.total, templateTotal: table.reduce((n, r) => n + r.tpl, 0) };
}

// ---------------------------------------------------------------- CLI

const HELP = `goshipit config helper

Usage: node config.js <command> [options]

Commands:
  init [--dir <projectDir>] [--off K,L,M] [--force]
        Copy template to <dir>/goshipit.md (default: cwd). --off unticks sections.
  select [--file <path>]
        Print selected checks as one-line JSON (default file: ./goshipit.md).
  rows <ID,ID,...>
        Print reference rows (plus category guidance) for the given check ids.
  sync [--file <path>]
        Append check ids added to references since goshipit.md was created.
  verify
        Maintainer: check template/references/README/SKILL/package.json agree.
  --help
        Show this help.

Exit codes: 0 ok, 1 error, 2 goshipit.md missing.`;

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--force' || a === '-f') opts.force = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (/^--(dir|file|off)=/.test(a)) {
      const [k, ...v] = a.slice(2).split('=');
      opts[k] = v.join('=');
    } else if (a === '--dir' || a === '--file' || a === '--off') {
      const v = argv[i + 1];
      if (v == null || (v.startsWith('--') && v.length > 2)) throw new CliError(`${a} needs a value`);
      opts[a.slice(2)] = v;
      i++;
    } else if (a.startsWith('--')) throw new CliError(`unknown option ${a}`);
    else opts._.push(a);
  }
  return opts;
}

function readConfigFile(file) {
  const p = path.resolve(file || 'goshipit.md');
  if (!fs.existsSync(p)) throw new CliError(`goshipit.md not found: ${p}`, 2);
  return { p, text: fs.readFileSync(p, 'utf8') };
}

function main(argv) {
  const opts = parseArgs(argv);
  const cmd = opts._.shift();
  if (opts.help || !cmd || cmd === 'help') {
    process.stdout.write(HELP + '\n');
    return cmd || opts.help ? 0 : 1;
  }
  switch (cmd) {
    case 'init': {
      const off = opts.off ? String(opts.off).split(/[,\s]+/).filter(Boolean) : [];
      const target = init({ dir: opts.dir, off, force: opts.force });
      process.stdout.write(target + '\n');
      return 0;
    }
    case 'select': {
      const { text } = readConfigFile(opts.file);
      const res = select(parseConfig(text));
      process.stdout.write(JSON.stringify(res) + '\n');
      return 0;
    }
    case 'rows': {
      const ids = opts._.join(',').split(/[,\s]+/).filter(Boolean);
      if (!ids.length) throw new CliError('rows: give check ids, e.g. rows A1,C7');
      const res = rows(ids);
      for (const w of res.warnings) process.stderr.write(w + '\n');
      if (res.text) process.stdout.write(res.text + '\n');
      return 0;
    }
    case 'sync': {
      const { p, text } = readConfigFile(opts.file);
      const res = sync(text);
      if (!res.added.length) {
        process.stdout.write(`sync: ${p} up to date (no new checks)\n`);
        return 0;
      }
      fs.writeFileSync(p, res.text);
      process.stdout.write(`sync: added ${res.added.length} new check(s) to ${p}: ${res.added.join(', ')} (sections ${res.touched.join(', ')})\n`);
      return 0;
    }
    case 'verify': {
      const res = verify();
      const pad = (s, n) => String(s).padEnd(n);
      const lines = ['| Cat | Name                    | Ref | Template | OK |', '|-----|-------------------------|-----|----------|----|'];
      for (const r of res.table) lines.push(`| ${pad(r.cat, 3)} | ${pad(r.name, 23)} | ${pad(r.ref, 3)} | ${pad(r.tpl, 8)} | ${r.ok ? 'ok' : 'XX'} |`);
      lines.push(`| ${pad('Σ', 3)} | ${pad('Total', 23)} | ${pad(res.total, 3)} | ${pad(res.templateTotal, 8)} |    |`);
      process.stdout.write(lines.join('\n') + '\n');
      if (res.ok) {
        process.stdout.write(`verify: OK (${res.total} checks)\n`);
        return 0;
      }
      for (const e of res.errors) process.stderr.write(`verify: ${e}\n`);
      process.stderr.write(`verify: FAILED (${res.errors.length} problem(s))\n`);
      return 1;
    }
    default:
      throw new CliError(`unknown command "${cmd}" (see --help)`);
  }
}

module.exports = {
  parseConfig,
  scanConfig,
  parseFrontmatter,
  normalizeSettings,
  select,
  rows,
  sync,
  init,
  verify,
  parseSkillFrontmatter,
  validateSkillFrontmatter,
  loadReferences,
  autoTitle,
  DEFAULT_SETTINGS,
  main,
};

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`goshipit config: ${e.message}\n`);
    process.exitCode = e instanceof CliError ? e.code : 1;
  }
}
