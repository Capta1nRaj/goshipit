#!/usr/bin/env node
// goshipit installer - copies the Agent Skills bundle (skills/goshipit/) into
// each AI tool's native skills directory. Spec: https://agentskills.io
// Zero deps, Node >= 18.

const fs     = require("fs");
const path   = require("path");
const os     = require("os");
const rl     = require("readline");
const crypto = require("crypto");
const { execSync, execFileSync } = require("child_process");
const https  = require("https");

// ─── constants ──────────────────────────────────────────────────────────────

const home     = os.homedir();
const isWin    = process.platform === "win32";
const isTTY    = process.stdout.isTTY;
const pkgRoot  = path.join(__dirname, "..");
const pkgJson  = JSON.parse(fs.readFileSync(path.join(pkgRoot, "package.json"), "utf8"));
const VERSION  = pkgJson.version;
const PKG_NAME = pkgJson.name;

const SKILL_NAME  = "goshipit";
const srcDir      = path.join(pkgRoot, "skills", SKILL_NAME);
const srcSkill    = path.join(srcDir, "SKILL.md");
const srcConfigJs = path.join(srcDir, "scripts", "config.js");

// ─── colors (ANSI, no deps) ─────────────────────────────────────────────────

const c = isTTY ? {
    reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
    green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m", cyan: "\x1b[36m",
} : Object.fromEntries(["reset","bold","dim","green","yellow","red","cyan"].map(k => [k, ""]));

const col = {
    ok:   (s) => `${c.green}${s}${c.reset}`,
    warn: (s) => `${c.yellow}${s}${c.reset}`,
    err:  (s) => `${c.red}${s}${c.reset}`,
    dim:  (s) => `${c.dim}${s}${c.reset}`,
    bold: (s) => `${c.bold}${s}${c.reset}`,
    cyan: (s) => `${c.cyan}${s}${c.reset}`,
};

// ─── flags ───────────────────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const isInit      = args[0] === "init";
const isUninstall = args.includes("--uninstall");
const isStatus    = args.includes("--status");
const isVersion   = args.includes("--version") || args.includes("-v");
const isDryRun    = args.includes("--dry-run");
const isYes       = args.includes("--yes") || args.includes("-y");
const isHelp      = args.includes("--help") || args.includes("-h");
const isProject   = args.includes("--project") || args.includes("-p");

// install scope: global (~) or project (cwd), mirroring `npx skills add [-g]`
const scopeRoot  = isProject ? process.cwd() : home;
const scopeLabel = isProject ? "project" : "global";

const notes = [];

// ─── helpers ─────────────────────────────────────────────────────────────────

function dirExists(p)  { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function fileExists(p) { try { return fs.statSync(p).isFile();      } catch { return false; } }
function isLink(p)     { try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; } }
function readText(p)   { try { return fs.readFileSync(p, "utf8"); } catch { return null; } }
function shortHash(s)  { return crypto.createHash("sha256").update(s).digest("hex").slice(0, 16); }
function tilde(p) {
    const cwd = process.cwd();
    if (isProject && p.startsWith(cwd + path.sep)) return "." + p.slice(cwd.length);
    return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

function commandExists(cmd) {
    try {
        execSync(isWin ? `where ${cmd}` : `command -v ${cmd}`, { stdio: "pipe", shell: isWin ? undefined : "/bin/sh" });
        return true;
    } catch { return false; }
}

function writeText(p, content) {
    if (isDryRun) { console.log(`  ${col.dim("[dry-run] would write " + tilde(p))}`); return; }
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content, "utf8");
}

function removePath(p) {
    if (!fs.existsSync(p) && !isLink(p)) return false;
    if (isDryRun) { console.log(`  ${col.dim("[dry-run] would remove " + tilde(p))}`); return true; }
    fs.rmSync(p, { recursive: true, force: true });
    return true;
}

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) copyDir(s, d);
        else if (entry.isFile()) fs.copyFileSync(s, d);
    }
}

// Version recorded in an installed SKILL.md (metadata.version), or null.
function skillVersionAt(dir) {
    const t = readText(path.join(dir, "SKILL.md"));
    if (t === null) return null;
    const m = t.match(/^\s+version:\s*["']?([^\s"']+)/m) || t.match(/^version:\s*["']?([^\s"']+)/m);
    return m ? m[1] : "?";
}

// A skills/<name> dir is ours only if its SKILL.md says `name: goshipit`.
function isOurSkillDir(dir) {
    const t = readText(path.join(dir, "SKILL.md"));
    return t !== null && /^name:\s*["']?goshipit["']?\s*$/m.test(t);
}

// Replace dest with a fresh copy of the skill bundle. Returns "installed" | "updated".
function installSkill(dest) {
    const exists = fs.existsSync(dest) || isLink(dest);
    if (exists && !isLink(dest) && !isOurSkillDir(dest)) {
        throw new Error(`${tilde(dest)} exists and is not a goshipit skill - left untouched`);
    }
    const action = exists ? "updated" : "installed";
    if (isDryRun) {
        console.log(`  ${col.dim("[dry-run] would copy skill → " + tilde(dest))}`);
        return action;
    }
    // stage then swap, so a failed copy never leaves a half-written skill
    const tmp = `${dest}.tmp-${process.pid}`;
    fs.rmSync(tmp, { recursive: true, force: true });
    copyDir(srcDir, tmp);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.renameSync(tmp, dest);
    return action;
}

function uninstallSkill(dest) {
    if (isLink(dest)) return removePath(dest);
    if (!dirExists(dest)) return false;
    if (!isOurSkillDir(dest)) {
        notes.push(`${col.warn("⚠")}  ${tilde(dest)} is not a goshipit skill - left untouched.`);
        return false;
    }
    return removePath(dest);
}

function extensionInstalled(prefix) {
    return [".vscode", ".vscode-server", ".cursor", ".windsurf"].some(d => {
        const dir = path.join(home, d, "extensions");
        try { return fs.readdirSync(dir).some(f => f.startsWith(prefix)); }
        catch { return false; }
    });
}

// ─── platforms ───────────────────────────────────────────────────────────────
// Skill dirs per tool, from the Agent Skills ecosystem (vercel-labs/skills
// docs/agents.md). `.agents/skills` is the shared location most tools read.

const PLATFORMS = [
    {
        key: "claude", label: "Claude Code",
        global: ".claude/skills", project: ".claude/skills",
        detect: () => dirExists(path.join(home, ".claude")) || commandExists("claude"),
        usage: 'Type /goshipit or say "goshipit" in Claude Code',
    },
    {
        key: "agents", label: "Codex · Cline · Zed",
        hint: "+ any tool reading ~/.agents/skills",
        global: ".agents/skills", project: ".agents/skills",
        detect: () => commandExists("codex") || dirExists(path.join(home, ".codex")) ||
                      commandExists("zed") || dirExists(path.join(home, ".config", "zed")) ||
                      (isWin && !!process.env.APPDATA && dirExists(path.join(process.env.APPDATA, "Zed"))) ||
                      extensionInstalled("saoudrizwan.claude-dev") || dirExists(path.join(home, ".cline")) ||
                      dirExists(path.join(home, ".agents")),
        usage: 'Say "goshipit" in Codex CLI, Cline, or Zed Agent',
    },
    {
        key: "cursor", label: "Cursor",
        global: ".cursor/skills", project: ".agents/skills",
        detect: () => dirExists(path.join(home, ".cursor")) || commandExists("cursor"),
        usage: 'Say "goshipit" in Cursor Agent',
    },
    {
        key: "gemini", label: "Gemini CLI",
        global: ".gemini/skills", project: ".agents/skills",
        detect: () => dirExists(path.join(home, ".gemini")) || commandExists("gemini"),
        usage: 'Say "goshipit" in Gemini CLI',
    },
    {
        key: "copilot", label: "GitHub Copilot",
        global: ".copilot/skills", project: ".agents/skills",
        detect: () => dirExists(path.join(home, ".copilot")) || extensionInstalled("github.copilot"),
        usage: 'Say "goshipit" in Copilot agent mode / Copilot CLI',
    },
    {
        key: "windsurf", label: "Windsurf",
        global: ".codeium/windsurf/skills", project: ".windsurf/skills",
        detect: () => dirExists(path.join(home, ".codeium", "windsurf")) || commandExists("windsurf"),
        usage: 'Say "goshipit" in Windsurf Cascade',
    },
    {
        key: "continue", label: "Continue",
        global: ".continue/skills", project: ".continue/skills",
        detect: () => dirExists(path.join(home, ".continue")) || commandExists("cn"),
        usage: 'Say "goshipit" in Continue',
    },
    {
        key: "opencode", label: "OpenCode",
        global: ".config/opencode/skills", project: ".agents/skills",
        detect: () => dirExists(path.join(home, ".config", "opencode")) || commandExists("opencode"),
        usage: 'Say "goshipit" in OpenCode',
    },
];

function skillDest(p) {
    return path.join(scopeRoot, ...(isProject ? p.project : p.global).split("/"), SKILL_NAME);
}

function installedAt(p) { return fileExists(path.join(skillDest(p), "SKILL.md")); }

// ─── legacy cleanup (v0.1.x pointer adapters) ────────────────────────────────
// Before v0.2.0 goshipit wrote rule/prompt files and settings.json entries per
// tool. Those are removed on install and uninstall. Only exact files we
// created, or text byte-identical to what we shipped, are touched.

const MARK_START = "<!-- goshipit:start -->";
const MARK_END   = "<!-- goshipit:end -->";
const LEGACY = {
    gemini:  ["403944d9eac426cb", "989a0ed5b6ab5013"],  // raw GEMINI.md tail
    cline:   ["c1c3933c2926d824", "f659638fb213266d"],  // raw settings string
    copilot: ["406bf0ef99208bbf", "4c5e5bbbc7be31f4"],  // trimmed settings text
};
const LEGACY_HEADING = "# goshipit — Pre-launch Codebase Audit";
const CLINE_KEY      = "cline.customInstructions";
const COPILOT_KEY    = "github.copilot.chat.codeGeneration.instructions";

function hasBlock(text) {
    return typeof text === "string" && text.includes(MARK_START) && text.includes(MARK_END);
}

function removeBlock(text) {
    if (!hasBlock(text)) return text;
    let s = text.indexOf(MARK_START);
    let e = text.indexOf(MARK_END, s);
    if (e < 0) return text;
    e += MARK_END.length;
    if (text[e] === "\n") e++;
    if (s >= 2 && text.slice(s - 2, s) === "\n\n") s -= 2;
    return text.slice(0, s) + text.slice(e);
}

function stripLegacyGemini(text) {
    const idx = text.lastIndexOf(LEGACY_HEADING);
    if (idx < 0 || !LEGACY.gemini.includes(shortHash(text.slice(idx)))) return text;
    let s = idx;
    if (s >= 2 && text.slice(s - 2, s) === "\n\n") s -= 2;
    return text.slice(0, s);
}

// Strip comments + trailing commas outside strings. Returns { json, hasComments }.
function stripJsonc(src) {
    let out = "", hasComments = false, i = 0;
    const n = src.length;
    while (i < n) {
        const ch = src[i];
        if (ch === '"') {
            let j = i + 1;
            while (j < n && src[j] !== '"') j += src[j] === "\\" ? 2 : 1;
            out += src.slice(i, j + 1);
            i = j + 1;
        } else if (ch === "/" && src[i + 1] === "/") {
            hasComments = true;
            while (i < n && src[i] !== "\n") i++;
        } else if (ch === "/" && src[i + 1] === "*") {
            hasComments = true;
            const end = src.indexOf("*/", i + 2);
            i = end < 0 ? n : end + 2;
            out += " ";
        } else { out += ch; i++; }
    }
    let res = "";
    for (let k = 0; k < out.length; k++) {
        const ch = out[k];
        if (ch === '"') {
            let j = k + 1;
            while (j < out.length && out[j] !== '"') j += out[j] === "\\" ? 2 : 1;
            res += out.slice(k, j + 1);
            k = j;
        } else if (ch === ",") {
            let j = k + 1;
            while (j < out.length && /\s/.test(out[j])) j++;
            if (out[j] !== "}" && out[j] !== "]") res += ch;
        } else res += ch;
    }
    return { json: res, hasComments };
}

function vsCodeSettingsPaths() {
    const apps = ["Code", "Cursor", "Windsurf"];
    let base;
    if (isWin) base = process.env.APPDATA || "";
    else if (process.platform === "darwin") base = path.join(home, "Library", "Application Support");
    else base = path.join(home, ".config");
    return base ? apps.map(a => path.join(base, a, "User", "settings.json")).filter(fileExists) : [];
}

function readSettings(p) {
    const raw = readText(p);
    if (raw === null || raw.trim() === "") return null;
    try {
        const { json, hasComments } = stripJsonc(raw);
        const obj = JSON.parse(json);
        if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
        return { obj, raw, hasComments };
    } catch { return null; }
}

function writeSettings(p, s) {
    const m = s.raw.match(/^([ \t]+)"/m);
    const out = JSON.stringify(s.obj, null, m ? m[1] : 4) + (s.raw.endsWith("\n") ? "\n" : "");
    if (out !== s.raw) writeText(p, out);
}

function clineIsOurs(v) {
    return typeof v === "string" && (hasBlock(v) || LEGACY.cline.includes(shortHash(v)));
}

function copilotIsOurs(item) {
    const t = item && typeof item.text === "string" ? item.text : null;
    return !!t && (hasBlock(t) || LEGACY.copilot.includes(shortHash(t.trim())));
}

// Clean ours out of VS Code-family settings.json. Never rewrites a file with comments.
function cleanLegacySettings() {
    const done = [];
    for (const p of vsCodeSettingsPaths()) {
        const s = readSettings(p);
        if (!s) continue;
        const cline   = clineIsOurs(s.obj[CLINE_KEY]);
        const copilot = Array.isArray(s.obj[COPILOT_KEY]) && s.obj[COPILOT_KEY].some(copilotIsOurs);
        if (!cline && !copilot) continue;
        if (s.hasComments) {
            notes.push(`${col.warn("⚠")}  ${tilde(p)} has comments - remove the old goshipit entries` +
                       ` from "${CLINE_KEY}" / "${COPILOT_KEY}" manually.`);
            continue;
        }
        if (cline) {
            const cur  = s.obj[CLINE_KEY];
            const next = hasBlock(cur) ? removeBlock(cur) : "";
            if (next.trim() === "") delete s.obj[CLINE_KEY];
            else s.obj[CLINE_KEY] = next;
        }
        if (copilot) {
            const kept = s.obj[COPILOT_KEY].filter(i => !copilotIsOurs(i));
            if (kept.length) s.obj[COPILOT_KEY] = kept;
            else delete s.obj[COPILOT_KEY];
        }
        writeSettings(p, s);
        done.push(p);
    }
    return done;
}

// Remove our marker block from a text file; delete the file if it becomes empty.
function cleanBlockFile(p, deleteIfEmpty) {
    const t = readText(p);
    if (t === null) return false;
    let next = removeBlock(t).replace(/\n\n<!-- goshipit: see [^\n]+ -->\n/g, "");
    if (path.basename(p) === "GEMINI.md") next = stripLegacyGemini(next);
    if (next === t) return false;
    if (deleteIfEmpty && next.trim() === "") return removePath(p);
    writeText(p, next);
    return true;
}

// Delete a file only if it is clearly a goshipit pointer we wrote.
function cleanOwnedFile(p) {
    const t = readText(p);
    return t !== null && t.includes("goshipit") && removePath(p);
}

function cleanLegacy() {
    const cwd = process.cwd();
    const zedPrompts = isWin && process.env.APPDATA
        ? path.join(process.env.APPDATA, "Zed", "prompts")
        : path.join(home, ".config", "zed", "prompts");
    const removed = [];
    const track = (ok, p) => { if (ok) removed.push(p); };

    // shared runbook dir from the pointer era
    const shared = path.join(home, ".goshipit");
    if (fileExists(path.join(shared, "SKILL.md"))) track(removePath(shared), shared);

    for (const p of [
        path.join(home, ".cursor", "rules", "goshipit.mdc"),
        path.join(cwd, ".cursor", "rules", "goshipit.mdc"),
        path.join(home, ".codeium", "windsurf", "memories", "goshipit.md"),
        path.join(home, ".codex", "goshipit.md"),
        path.join(zedPrompts, "goshipit.md"),
        path.join(home, ".cline", "goshipit.md"),
        path.join(home, ".continue", "prompts", "goshipit.prompt"),
    ]) track(cleanOwnedFile(p), p);

    for (const [p, del] of [
        [path.join(home, ".codex", "AGENTS.md"), true],
        [path.join(cwd, "AGENTS.md"), false],
        [path.join(home, ".gemini", "GEMINI.md"), true],
        [path.join(cwd, ".github", "copilot-instructions.md"), true],
    ]) track(cleanBlockFile(p, del), p);

    for (const p of cleanLegacySettings()) removed.push(p);
    return removed;
}

// ─── misc ────────────────────────────────────────────────────────────────────

function askLine(iface, question) {
    return new Promise(resolve => iface.question(question, resolve));
}

function parseSelection(input, max) {
    return [...new Set(
        input.split(/[\s,]+/)
             .map(n => parseInt(n, 10) - 1)
             .filter(n => !isNaN(n) && n >= 0 && n < max)
    )];
}

function isNewer(a, b) {
    const pa = String(a).split(".").map(n => parseInt(n, 10) || 0);
    const pb = String(b).split(".").map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
    return false;
}

function fetchLatestVersion() {
    return new Promise(resolve => {
        const req = https.get(`https://registry.npmjs.org/${PKG_NAME}/latest`, res => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => { try { resolve(JSON.parse(data).version); } catch { resolve(null); } });
        });
        req.on("error", () => resolve(null));
        req.setTimeout(4000, () => { req.destroy(); resolve(null); });
    });
}

function padCol(raw, len, colorFn) {
    return colorFn(raw) + " ".repeat(Math.max(0, len - raw.length));
}

function printNotes() {
    if (notes.length === 0) return;
    console.log(`\n  Manual steps:`);
    for (const n of notes) console.log(`    ${n}`);
}

// Unique destinations for a platform list (several tools share .agents/skills).
function groupByDest(list) {
    const map = new Map();
    for (const p of list) {
        const d = skillDest(p);
        if (!map.has(d)) map.set(d, []);
        map.get(d).push(p);
    }
    return map;
}

// ─── init (delegates to scripts/config.js) ───────────────────────────────────

function runInit() {
    if (!fileExists(srcConfigJs)) {
        console.error(col.err("\nError: skills/goshipit/scripts/config.js not found in package. Reinstall: npx goshipit@latest"));
        process.exit(1);
    }
    try {
        execFileSync(process.execPath, [srcConfigJs, "init", ...args.slice(1)], { stdio: "inherit" });
    } catch (e) {
        process.exit(typeof e.status === "number" ? e.status : 1);
    }
}

// ─── --help ──────────────────────────────────────────────────────────────────

function showHelp() {
    console.log(`
  ${col.bold("goshipit")} ${col.cyan("v" + VERSION)} — Pre-launch codebase audit skill (Agent Skills format)

  ${col.bold("Install / Uninstall:")}
    ${col.cyan("npx goshipit")}                     pick AI tools, install the skill globally (~)
    ${col.cyan("npx goshipit -y")}                  install to every detected tool, no prompt
    ${col.cyan("npx goshipit --project")}           install into this repo (.agents/skills, .claude/skills, ...)
    ${col.cyan("npx goshipit --uninstall")}         pick AI tools to remove it from
    ${col.cyan("npx goshipit --uninstall -y")}      remove from every tool it is installed in
    ${col.cyan("npx goshipit --dry-run")}           preview, touch nothing
    ${col.cyan("npx goshipit@latest")}              update

  ${col.bold("Also works with:")}
    ${col.cyan("npx skills add Capta1nRaj/goshipit")}   (vercel-labs/skills CLI)

  ${col.bold("Project config:")}
    ${col.cyan("npx goshipit init")}                create goshipit.md (check list) in the current dir
    ${col.cyan("npx goshipit init --force")}        overwrite an existing goshipit.md
    ${col.cyan("npx goshipit init --dir <path>")}   create it in another project dir
    ${col.cyan("npx goshipit init --off K,L,M")}    start with those sections unticked

  ${col.bold("Info:")}
    ${col.cyan("npx goshipit --status")}            detected + installed per tool, with paths
    ${col.cyan("npx goshipit --version")}           local version + npm latest

  ${col.bold("Tools:")} ${PLATFORMS.map(p => p.label).join(", ")}
  ${col.bold("Repo:")}  https://github.com/Capta1nRaj/goshipit
`);
}

// ─── --version ───────────────────────────────────────────────────────────────

async function showVersion() {
    console.log(`\n  ${col.bold("goshipit")} ${col.cyan("v" + VERSION)} (local)\n`);
    process.stdout.write(`  Checking npm for latest version...`);
    const latest = await fetchLatestVersion();
    if (!latest)                     process.stdout.write(`\r  ${col.dim("(could not reach npm)")}${" ".repeat(20)}\n`);
    else if (isNewer(latest, VERSION)) process.stdout.write(`\r  ${col.warn("↑ v" + latest + " available")} — run ${col.cyan("npx goshipit@latest")}\n`);
    else                             process.stdout.write(`  ${col.ok("✓ up to date")}\n`);
    console.log();
}

// ─── --status ────────────────────────────────────────────────────────────────

function showStatus() {
    console.log(`\n  ${col.bold("goshipit")} ${col.cyan("v" + VERSION)} — status (${scopeLabel})\n`);
    console.log(`  ${"Tool".padEnd(22)} ${"Detected".padEnd(9)} ${"Installed".padEnd(10)} Path`);
    console.log(`  ${"─".repeat(76)}`);
    for (const p of PLATFORMS) {
        const detected = p.detect();
        const dest = skillDest(p);
        const v = skillVersionAt(dest);
        const iRaw = v ? "v" + v : "no";
        console.log(
            `  ${p.label.padEnd(22)} ` +
            `${padCol(detected ? "yes" : "no", 9, detected ? col.ok : col.dim)} ` +
            `${padCol(iRaw, 10, !v ? col.dim : v === VERSION ? col.ok : col.warn)} ` +
            `${col.dim(tilde(dest))}`
        );
    }
    console.log();
}

// ─── interactive picker ──────────────────────────────────────────────────────

async function pickPlatforms(mode) {
    const uninstallMode = mode === "uninstall";
    const rows = PLATFORMS.map((p, i) => ({
        index: i + 1, platform: p,
        detected: p.detect(), installed: installedAt(p),
    }));

    console.log(`\n  ${col.bold("🚀 goshipit")} ${col.cyan("v" + VERSION)} — ${uninstallMode ? "uninstall" : "install"} (${scopeLabel})\n`);
    for (const r of rows) {
        const badge = uninstallMode
            ? (r.installed ? col.ok("installed") : col.dim("not installed"))
            : (r.detected  ? col.ok("detected")  : col.dim("not detected"));
        const hint = r.platform.hint ? " " + col.dim(r.platform.hint) : "";
        console.log(`    [${r.index}] ${r.platform.label.padEnd(22)} ${badge}${hint}`);
    }

    const pickDefault = () => rows.filter(r => uninstallMode ? r.installed : r.detected).map(r => r.platform);
    const what = uninstallMode ? "installed" : "detected";
    const prompt = `\n  Numbers (e.g. "1,3"), "all", or ${col.dim("Enter")} for ${what}: `;

    if (isYes || !process.stdin.isTTY) {
        console.log(`${prompt}${col.dim("(auto: " + what + ")")}`);
        return pickDefault();
    }

    const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
    const input = (await askLine(iface, prompt)).trim().toLowerCase();
    iface.close();

    if (!input) return pickDefault();
    if (input === "all" || input === "a") return PLATFORMS;
    return parseSelection(input, PLATFORMS.length).map(i => PLATFORMS[i]);
}

// ─── run install ─────────────────────────────────────────────────────────────

async function runInstall(selected) {
    if (!fileExists(srcSkill)) {
        console.error(col.err("\nError: skills/goshipit/SKILL.md not found in package. Reinstall: npx goshipit@latest"));
        process.exit(1);
    }
    if (isDryRun) console.log(`\n  ${col.warn("[dry-run] no files will be written")}\n`);

    const latestPromise = fetchLatestVersion();
    const results = [];
    for (const [dest, platforms] of groupByDest(selected)) {
        try {
            const action = installSkill(dest);
            const ok = isDryRun || fileExists(path.join(dest, "SKILL.md"));
            results.push({ platforms, dest, status: ok ? "ok" : "verify-fail", action });
        } catch (e) {
            results.push({ platforms, dest, status: "err", error: e.message });
        }
    }
    const migrated = isProject ? [] : cleanLegacy();

    console.log(`\n  ${col.ok("✅ goshipit v" + VERSION + (isDryRun ? " [dry-run]" : ""))}\n`);
    for (const r of results) {
        const label = r.platforms.map(p => p.label).join(", ").padEnd(22);
        if (r.status === "ok") {
            console.log(`    ${col.ok("✅")} ${label} ${col.dim(tilde(r.dest))} ${r.action === "updated" ? col.cyan("(updated)") : ""}`);
        } else if (r.status === "verify-fail") {
            console.log(`    ${col.warn("⚠")}  ${label} ${col.warn("copied but SKILL.md missing — check permissions")}`);
        } else {
            console.log(`    ${col.err("❌")} ${label} ${col.err(r.error)}`);
        }
    }
    if (migrated.length) {
        console.log(`\n  Removed old v0.1.x pointer files:`);
        for (const p of migrated) console.log(`    ${col.dim("• " + tilde(p))}`);
    }
    printNotes();

    const ok = results.filter(r => r.status === "ok");
    if (ok.length) {
        console.log(`\n  Usage:`);
        for (const r of ok) for (const p of r.platforms) console.log(`    • ${p.usage}`);
        console.log(`    • First run creates ${col.cyan("goshipit.md")} in your project — tick checks, then say "goshipit"`);
    }

    const latest = await latestPromise;
    if (latest && isNewer(latest, VERSION)) {
        console.log(`\n  ${col.warn("↑ v" + latest + " available")} — run ${col.cyan("npx goshipit@latest")}`);
    }
    console.log(`\n  Status: ${col.cyan("npx goshipit --status")}   Uninstall: ${col.cyan("npx goshipit --uninstall")}\n`);
    if (results.some(r => r.status !== "ok")) process.exitCode = 1;
}

// ─── run uninstall ───────────────────────────────────────────────────────────

function runUninstall(selected) {
    if (isDryRun) console.log(`\n  ${col.warn("[dry-run] no files will be removed")}\n`);

    // a shared dir (.agents/skills) is kept while any unselected tool still uses it
    const keep = new Set(PLATFORMS.filter(p => !selected.includes(p)).map(skillDest));
    const results = [];
    for (const [dest, platforms] of groupByDest(selected)) {
        if (keep.has(dest)) {
            results.push({ platforms, dest, status: "shared" });
            continue;
        }
        results.push({ platforms, dest, status: uninstallSkill(dest) ? "ok" : "skip" });
    }
    const migrated = isProject ? [] : cleanLegacy();

    console.log(`\n  ${col.ok("🗑️  goshipit " + (isDryRun ? "[dry-run]" : "uninstalled"))}\n`);
    for (const r of results) {
        const label = r.platforms.map(p => p.label).join(", ").padEnd(22);
        if (r.status === "ok")          console.log(`    ${col.ok("✅")} ${label} removed ${col.dim(tilde(r.dest))}`);
        else if (r.status === "shared") console.log(`    ${col.dim("⏭️ ")} ${label} ${col.dim("kept - " + tilde(r.dest) + " is shared with another tool")}`);
        else                            console.log(`    ${col.dim("⏭️ ")} ${label} ${col.dim("not installed")}`);
    }
    for (const p of migrated) console.log(`    ${col.ok("✅")} ${"old v0.1.x file".padEnd(22)} ${col.dim(tilde(p))}`);
    printNotes();
    console.log(`\n  Reinstall anytime: ${col.cyan("npx goshipit")}\n`);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
    if (isInit)    { runInit(); return; }
    if (isHelp)    { showHelp(); return; }
    if (isVersion) { await showVersion(); return; }
    if (isStatus)  { showStatus(); return; }

    const selected = await pickPlatforms(isUninstall ? "uninstall" : "install");
    if (selected.length === 0) {
        console.log(`\n  ${col.dim("Nothing selected. Exiting.")}\n`);
        return;
    }
    if (isUninstall) runUninstall(selected);
    else             await runInstall(selected);
}

if (require.main === module) {
    main().catch(e => { console.error(col.err(e.message)); process.exit(1); });
} else {
    module.exports = { stripJsonc, removeBlock, stripLegacyGemini, isOurSkillDir, PLATFORMS };
}
