#!/usr/bin/env node

const fs   = require("fs");
const path = require("path");
const os   = require("os");
const rl   = require("readline");
const { execSync } = require("child_process");
const https = require("https");

// ─── constants ──────────────────────────────────────────────────────────────

const home    = os.homedir();
const isWin   = process.platform === "win32";
const isTTY   = process.stdout.isTTY;
const pkgJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
const VERSION = pkgJson.version;
const PKG_NAME = pkgJson.name;

const pkgRoot    = path.join(__dirname, "..");
const srcSkill   = path.join(pkgRoot, "goshipit", "SKILL.md");
const srcRefs    = path.join(pkgRoot, "goshipit", "references");
const srcAdapters = path.join(pkgRoot, "goshipit", "adapters");
const sharedDir  = path.join(home, ".goshipit");
const sharedRefs = path.join(sharedDir, "references");

// ─── colors (ANSI, no deps) ─────────────────────────────────────────────────

const c = isTTY ? {
    reset:   "\x1b[0m",
    bold:    "\x1b[1m",
    dim:     "\x1b[2m",
    green:   "\x1b[32m",
    yellow:  "\x1b[33m",
    red:     "\x1b[31m",
    cyan:    "\x1b[36m",
    blue:    "\x1b[34m",
    magenta: "\x1b[35m",
    white:   "\x1b[37m",
} : Object.fromEntries(
    ["reset","bold","dim","green","yellow","red","cyan","blue","magenta","white"].map(k => [k, ""])
);

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
const isUninstall = args.includes("--uninstall");
const isStatus    = args.includes("--status");
const isVersion   = args.includes("--version") || args.includes("-v");
const isDryRun    = args.includes("--dry-run");
const isYes       = args.includes("--yes") || args.includes("-y");
const isHelp      = args.includes("--help") || args.includes("-h");

// ─── helpers ─────────────────────────────────────────────────────────────────

function dirExists(p)  { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function fileExists(p) { try { return fs.statSync(p).isFile();      } catch { return false; } }

function commandExists(cmd) {
    try {
        execSync(isWin ? `where ${cmd}` : `which ${cmd}`, { stdio: "pipe" });
        return true;
    } catch { return false; }
}

function copyDir(src, dest) {
    if (!isDryRun) fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
        const s = path.join(src, file);
        const d = path.join(dest, file);
        if (fs.statSync(s).isDirectory()) copyDir(s, d);
        else if (!isDryRun) fs.copyFileSync(s, d);
    }
}

function ensureDir(p) {
    if (!isDryRun) fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
    if (isDryRun) {
        console.log(`  ${col.dim("[dry-run] would copy → " + dest)}`);
        return;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
}

function removePath(p) {
    if (!fs.existsSync(p)) return false;
    if (isDryRun) {
        console.log(`  ${col.dim("[dry-run] would remove " + p)}`);
        return true;
    }
    const stat = fs.statSync(p);
    if (stat.isDirectory()) fs.rmSync(p, { recursive: true, force: true });
    else fs.unlinkSync(p);
    return true;
}

function verifyFile(p) {
    try { return fs.existsSync(p) && fs.statSync(p).size > 0; }
    catch { return false; }
}

// ─── VS Code settings.json helpers ───────────────────────────────────────────

function vsCodeSettingsPaths() {
    const candidates = [];
    if (isWin) {
        if (process.env.APPDATA) {
            candidates.push(path.join(process.env.APPDATA, "Code", "User", "settings.json"));
            candidates.push(path.join(process.env.APPDATA, "Cursor", "User", "settings.json"));
        }
    } else if (process.platform === "darwin") {
        const base = path.join(home, "Library", "Application Support");
        candidates.push(path.join(base, "Code", "User", "settings.json"));
        candidates.push(path.join(base, "Cursor", "User", "settings.json"));
    } else {
        candidates.push(path.join(home, ".config", "Code", "User", "settings.json"));
        candidates.push(path.join(home, ".config", "Cursor", "User", "settings.json"));
    }
    return candidates.filter(p => fileExists(p));
}

function readVSCodeSettings(settingsPath) {
    try {
        const raw = fs.readFileSync(settingsPath, "utf8");
        // Strip single-line comments so JSON.parse works on JSONC
        const stripped = raw.replace(/^\s*\/\/.*$/gm, "").replace(/,\s*([\]}])/g, "$1");
        return JSON.parse(stripped);
    } catch { return null; }
}

function writeVSCodeSettings(settingsPath, obj) {
    if (isDryRun) {
        console.log(`  ${col.dim("[dry-run] would update " + settingsPath)}`);
        return true;
    }
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(obj, null, 4), "utf8");
        return true;
    } catch { return false; }
}

function getCopilotInstruction() {
    try { return fs.readFileSync(path.join(srcAdapters, "copilot.md"), "utf8").trim(); }
    catch { return "When asked to 'goshipit' or 'is my app ready?': run the goshipit pre-launch audit. Read ~/.goshipit/references/ for check definitions. NEVER read .env*, .pem, .key, id_rsa, credentials.json."; }
}

function installCopilotToSettings() {
    const paths = vsCodeSettingsPaths();
    if (paths.length === 0) return null;
    const results = [];
    for (const p of paths) {
        const settings = readVSCodeSettings(p) || {};
        const existing = settings["github.copilot.chat.codeGeneration.instructions"] || [];
        const alreadySet = existing.some(i => i.text && i.text.includes("goshipit"));
        if (!alreadySet) {
            settings["github.copilot.chat.codeGeneration.instructions"] = [
                ...existing,
                { text: getCopilotInstruction() },
            ];
            writeVSCodeSettings(p, settings);
        }
        results.push(p);
    }
    return results;
}

function uninstallCopilotFromSettings() {
    for (const p of vsCodeSettingsPaths()) {
        const settings = readVSCodeSettings(p);
        if (!settings) continue;
        const key = "github.copilot.chat.codeGeneration.instructions";
        if (Array.isArray(settings[key])) {
            settings[key] = settings[key].filter(i => !(i.text && i.text.includes("goshipit")));
            if (settings[key].length === 0) delete settings[key];
            writeVSCodeSettings(p, settings);
        }
    }
}

function installClineToSettings() {
    const paths = vsCodeSettingsPaths();
    if (paths.length === 0) return null;
    const instructions = fs.readFileSync(path.join(srcAdapters, "cline.md"), "utf8");
    const results = [];
    for (const p of paths) {
        const settings = readVSCodeSettings(p) || {};
        if (!settings["cline.customInstructions"] || !settings["cline.customInstructions"].includes("goshipit")) {
            settings["cline.customInstructions"] = instructions;
            writeVSCodeSettings(p, settings);
        }
        results.push(p);
    }
    return results;
}

function uninstallClineFromSettings() {
    for (const p of vsCodeSettingsPaths()) {
        const settings = readVSCodeSettings(p);
        if (!settings) continue;
        if (settings["cline.customInstructions"] && settings["cline.customInstructions"].includes("goshipit")) {
            delete settings["cline.customInstructions"];
            writeVSCodeSettings(p, settings);
        }
    }
}

function hasClineExtension() {
    const parents = [
        path.join(home, ".vscode", "extensions"),
        path.join(home, ".cursor", "extensions"),
        path.join(home, ".vscode-server", "extensions"),
    ];
    for (const dir of parents) {
        if (!dirExists(dir)) continue;
        try { if (fs.readdirSync(dir).some(f => f.startsWith("saoudrizwan.claude-dev"))) return true; }
        catch {}
    }
    return false;
}

function askLine(iface, question) {
    return new Promise(resolve => iface.question(question, resolve));
}

function parseSelection(input, max) {
    const t = input.trim().toLowerCase();
    if (!t || t === "all" || t === "a") return Array.from({ length: max }, (_, i) => i);
    return [...new Set(
        t.split(/[\s,]+/)
         .map(n => parseInt(n, 10) - 1)
         .filter(n => !isNaN(n) && n >= 0 && n < max)
    )];
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

function stripGoshipitComment(filePath) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    const cleaned = content.replace(/\n\n<!-- goshipit: see [^\n]+ -->\n/g, "");
    if (cleaned !== content && !isDryRun) fs.writeFileSync(filePath, cleaned, "utf8");
}

// ─── platform path resolution (Windows-aware) ────────────────────────────────

function zedPromptsDir() {
    if (isWin && process.env.APPDATA) return path.join(process.env.APPDATA, "Zed", "prompts");
    return path.join(home, ".config", "zed", "prompts");
}

function zedDetect() {
    if (isWin) return commandExists("zed") || (process.env.APPDATA && dirExists(path.join(process.env.APPDATA, "Zed")));
    return commandExists("zed") || dirExists(path.join(home, ".config", "zed"));
}

// ─── platform definitions ────────────────────────────────────────────────────

const PLATFORMS = [
    {
        key: "claude",
        label: "Claude Code",
        detect:      () => dirExists(path.join(home, ".claude")) || commandExists("claude"),
        installedAt: () => fileExists(path.join(home, ".claude", "skills", "goshipit", "SKILL.md")),
        install() {
            const skillDir = path.join(home, ".claude", "skills", "goshipit");
            ensureDir(skillDir);
            copyFile(srcSkill, path.join(skillDir, "SKILL.md"));
            copyDir(srcRefs, path.join(skillDir, "references"));
            return path.join(skillDir, "SKILL.md");
        },
        verify:        () => verifyFile(path.join(home, ".claude", "skills", "goshipit", "SKILL.md")),
        uninstallPaths: [path.join(home, ".claude", "skills", "goshipit")],
        usage: 'Say "goshipit" or "is my app ready?" in Claude Code',
    },
    {
        key: "cursor",
        label: "Cursor",
        detect:      () => dirExists(path.join(home, ".cursor")) || commandExists("cursor"),
        installedAt: () => fileExists(path.join(home, ".cursor", "rules", "goshipit.mdc")),
        install() {
            const globalDest = path.join(home, ".cursor", "rules", "goshipit.mdc");
            copyFile(path.join(srcAdapters, "cursor.mdc"), globalDest);
            // Also install project-level rules if inside a project with .cursor/rules/
            const projectRulesDir = path.join(process.cwd(), ".cursor", "rules");
            if (dirExists(path.join(process.cwd(), ".cursor")) || dirExists(projectRulesDir)) {
                const projDest = path.join(projectRulesDir, "goshipit.mdc");
                copyFile(path.join(srcAdapters, "cursor.mdc"), projDest);
            }
            return globalDest;
        },
        verify:        () => verifyFile(path.join(home, ".cursor", "rules", "goshipit.mdc")),
        uninstallPaths: [
            path.join(home, ".cursor", "rules", "goshipit.mdc"),
            path.join(process.cwd(), ".cursor", "rules", "goshipit.mdc"),
        ],
        usage: 'Say "goshipit" or "is my app ready?" in Cursor Agent',
    },
    {
        key: "windsurf",
        label: "Windsurf",
        detect:      () => dirExists(path.join(home, ".codeium")) || commandExists("windsurf"),
        installedAt: () => fileExists(path.join(home, ".codeium", "windsurf", "memories", "goshipit.md")),
        install() {
            const dest = path.join(home, ".codeium", "windsurf", "memories", "goshipit.md");
            copyFile(path.join(srcAdapters, "windsurf.md"), dest);
            return dest;
        },
        verify:        () => verifyFile(path.join(home, ".codeium", "windsurf", "memories", "goshipit.md")),
        uninstallPaths: [path.join(home, ".codeium", "windsurf", "memories", "goshipit.md")],
        usage: 'Say "goshipit" or "is my app ready?" in Windsurf Cascade',
    },
    {
        key: "codex",
        label: "OpenAI Codex CLI",
        detect:      () => commandExists("codex") || dirExists(path.join(home, ".codex")),
        installedAt: () => fileExists(path.join(home, ".codex", "goshipit.md")),
        install() {
            const dest = path.join(home, ".codex", "goshipit.md");
            copyFile(path.join(srcAdapters, "codex.md"), dest);
            if (!isDryRun) {
                const agentsMd = path.join(process.cwd(), "AGENTS.md");
                if (fs.existsSync(agentsMd)) {
                    const content = fs.readFileSync(agentsMd, "utf8");
                    if (!content.includes("goshipit")) {
                        fs.appendFileSync(agentsMd, "\n\n<!-- goshipit: see ~/.codex/goshipit.md -->\n");
                    }
                }
            }
            return dest;
        },
        verify: () => verifyFile(path.join(home, ".codex", "goshipit.md")),
        uninstallPaths: [path.join(home, ".codex", "goshipit.md")],
        uninstallHook() {
            // Clean up AGENTS.md comment
            const agentsMd = path.join(process.cwd(), "AGENTS.md");
            stripGoshipitComment(agentsMd);
        },
        usage: 'Say "goshipit" or "is my app ready?" in Codex CLI',
    },
    {
        key: "gemini",
        label: "Gemini CLI",
        detect:      () => commandExists("gemini") || dirExists(path.join(home, ".gemini")),
        installedAt: () => {
            const geminiMd = path.join(home, ".gemini", "GEMINI.md");
            return fileExists(geminiMd) && fs.readFileSync(geminiMd, "utf8").includes("goshipit");
        },
        install() {
            const geminiMd = path.join(home, ".gemini", "GEMINI.md");
            fs.mkdirSync(path.dirname(geminiMd), { recursive: true });
            if (!isDryRun) {
                const content = fs.readFileSync(path.join(srcAdapters, "gemini.md"), "utf8");
                if (fileExists(geminiMd)) {
                    const existing = fs.readFileSync(geminiMd, "utf8");
                    if (!existing.includes("goshipit"))
                        fs.appendFileSync(geminiMd, "\n\n" + content);
                } else {
                    fs.writeFileSync(geminiMd, content, "utf8");
                }
            }
            return geminiMd;
        },
        verify: () => {
            const geminiMd = path.join(home, ".gemini", "GEMINI.md");
            return fileExists(geminiMd) && fs.readFileSync(geminiMd, "utf8").includes("goshipit");
        },
        uninstallPaths: [],
        uninstallHook() {
            const geminiMd = path.join(home, ".gemini", "GEMINI.md");
            if (!fileExists(geminiMd)) return;
            const content = fs.readFileSync(geminiMd, "utf8");
            const stripped = content.replace(/\n\n[\s\S]*?goshipit[\s\S]*?(?=\n\n|$)/g, "").trim();
            if (stripped === "") {
                fs.unlinkSync(geminiMd);
            } else {
                fs.writeFileSync(geminiMd, stripped + "\n", "utf8");
            }
        },
        usage: 'Say "goshipit" or "is my app ready?" in Gemini CLI',
    },
    {
        key: "zed",
        label: "Zed",
        detect:      zedDetect,
        installedAt: () => fileExists(path.join(zedPromptsDir(), "goshipit.md")),
        install() {
            const dest = path.join(zedPromptsDir(), "goshipit.md");
            copyFile(path.join(srcAdapters, "zed.md"), dest);
            return dest;
        },
        verify:        () => verifyFile(path.join(zedPromptsDir(), "goshipit.md")),
        uninstallPaths: [path.join(zedPromptsDir(), "goshipit.md")],
        usage: 'Say "goshipit" or "is my app ready?" in Zed Agent',
    },
    {
        key: "cline",
        label: "Cline",
        detect: hasClineExtension,
        installedAt: () => vsCodeSettingsPaths().some(p => {
            const s = readVSCodeSettings(p);
            return s && s["cline.customInstructions"] && s["cline.customInstructions"].includes("goshipit");
        }),
        install() {
            const updated = installClineToSettings();
            if (!updated || updated.length === 0) {
                const dest = path.join(home, ".cline", "goshipit.md");
                copyFile(path.join(srcAdapters, "cline.md"), dest);
                return dest + " (VS Code settings.json not found — paste file contents into Cline → Settings → Custom Instructions)";
            }
            return updated.join(", ");
        },
        verify: () => vsCodeSettingsPaths().some(p => {
            const s = readVSCodeSettings(p);
            return s && s["cline.customInstructions"] && s["cline.customInstructions"].includes("goshipit");
        }),
        uninstallPaths: [path.join(home, ".cline", "goshipit.md")],
        uninstallHook: uninstallClineFromSettings,
        usage: 'Say "goshipit" or "is my app ready?" in Cline (global)',
    },
    {
        key: "copilot",
        label: "GitHub Copilot",
        detect: () => {
            const extParents = [
                path.join(home, ".vscode", "extensions"),
                path.join(home, ".vscode-server", "extensions"),
                path.join(home, ".cursor", "extensions"),
            ];
            return extParents.some(dir => {
                if (!dirExists(dir)) return false;
                try { return fs.readdirSync(dir).some(f => f.startsWith("github.copilot")); }
                catch { return false; }
            });
        },
        installedAt: () => vsCodeSettingsPaths().some(p => {
            const s = readVSCodeSettings(p);
            const arr = s && s["github.copilot.chat.codeGeneration.instructions"];
            return Array.isArray(arr) && arr.some(i => i.text && i.text.includes("goshipit"));
        }),
        install() {
            const updated = installCopilotToSettings();
            if (!updated || updated.length === 0) {
                const dest = path.join(process.cwd(), ".github", "copilot-instructions.md");
                fs.mkdirSync(path.dirname(dest), { recursive: true });
                if (!isDryRun && fs.existsSync(dest)) {
                    const existing = fs.readFileSync(dest, "utf8");
                    if (!existing.includes("goshipit"))
                        fs.appendFileSync(dest, "\n\n" + fs.readFileSync(path.join(srcAdapters, "copilot.md"), "utf8"));
                } else {
                    copyFile(path.join(srcAdapters, "copilot.md"), dest);
                }
                return dest + " (project-level fallback — VS Code settings.json not found)";
            }
            return updated.join(", ");
        },
        verify: () => vsCodeSettingsPaths().some(p => {
            const s = readVSCodeSettings(p);
            const arr = s && s["github.copilot.chat.codeGeneration.instructions"];
            return Array.isArray(arr) && arr.some(i => i.text && i.text.includes("goshipit"));
        }),
        uninstallPaths: [],
        uninstallHook: uninstallCopilotFromSettings,
        usage: 'Say "goshipit" or "is my app ready?" in GitHub Copilot Chat (global — all projects)',
    },
    {
        key: "continue",
        label: "Continue.dev",
        detect: () => dirExists(path.join(home, ".continue")) || commandExists("continue"),
        installedAt: () => fileExists(path.join(home, ".continue", "prompts", "goshipit.prompt")),
        install() {
            const dest = path.join(home, ".continue", "prompts", "goshipit.prompt");
            copyFile(path.join(srcAdapters, "continue.prompt"), dest);
            return dest;
        },
        verify:        () => verifyFile(path.join(home, ".continue", "prompts", "goshipit.prompt")),
        uninstallPaths: [path.join(home, ".continue", "prompts", "goshipit.prompt")],
        usage: 'Type /goshipit in Continue.dev chat, or say "is my app ready?"',
    },
    {
        key: "opencode",
        label: "OpenCode",
        detect: () => dirExists(path.join(home, ".config", "opencode")) || dirExists(path.join(home, ".opencode")) || commandExists("opencode"),
        installedAt: () => fileExists(path.join(home, ".config", "opencode", "skills", "goshipit", "SKILL.md")) || fileExists(path.join(home, ".opencode", "skills", "goshipit", "SKILL.md")),
        install() {
            // global: ~/.config/opencode/skills/goshipit (always)
            const skillDir = path.join(home, ".config", "opencode", "skills", "goshipit");
            ensureDir(skillDir);
            copyFile(srcSkill, path.join(skillDir, "SKILL.md"));
            copyDir(srcRefs, path.join(skillDir, "references"));
            copyFile(path.join(srcAdapters, "opencode.md"), path.join(skillDir, "opencode.md"));
            return path.join(skillDir, "SKILL.md");
        },
        verify:        () => verifyFile(path.join(home, ".config", "opencode", "skills", "goshipit", "SKILL.md")),
        uninstallPaths: [path.join(home, ".config", "opencode", "skills", "goshipit")],
        usage: 'Say "goshipit" or "is my app ready?" in OpenCode TUI',
    },
];

// ─── shared refs install ─────────────────────────────────────────────────────

function installSharedRefs() {
    ensureDir(sharedRefs);
    copyDir(srcRefs, sharedRefs);
}

// ─── pad with color (avoids ANSI code length messing padEnd) ─────────────────

function padCol(raw, len, colorFn) {
    return colorFn(raw) + " ".repeat(Math.max(0, len - raw.length));
}

// ─── --help ──────────────────────────────────────────────────────────────────

function showHelp() {
    const platforms = PLATFORMS.map(p => p.key).join(",");
    console.log(`
  ${col.bold("goshipit")} ${col.cyan("v" + VERSION)} — Pre-launch codebase audit for AI coding tools

  ${col.bold("Usage:")}
    npx goshipit [flags]

  ${col.bold("Install / Uninstall:")}
    ${col.cyan("npx goshipit")}                     interactive picker — choose which AI tools to install
    ${col.cyan("npx goshipit --uninstall")}          interactive picker — choose which to remove
    ${col.cyan("npx goshipit -y")}                   skip picker, install all detected tools
    ${col.cyan("npx goshipit --uninstall -y")}       skip picker, remove all installed tools
    ${col.cyan("npx goshipit --dry-run")}            preview what would install/remove, touch nothing
    ${col.cyan("npx goshipit@latest")}               update to latest version

  ${col.bold("Info:")}
    ${col.cyan("npx goshipit --status")}             show detected + installed status per platform
    ${col.cyan("npx goshipit --version")}            show local version and check npm for updates
    ${col.cyan("npx goshipit --help")}               show this help

  ${col.bold("Supported platforms:")}
    ${platforms}

  ${col.bold("Repo:")} https://github.com/Capta1nRaj/goshipit
`);
}

// ─── --version ───────────────────────────────────────────────────────────────

async function showVersion() {
    console.log(`\n  ${col.bold("goshipit")} ${col.cyan("v" + VERSION)} (local)\n`);
    process.stdout.write(`  Checking npm for latest version...`);
    const latest = await fetchLatestVersion();
    if (latest) {
        if (latest === VERSION) {
            process.stdout.write(`  ${col.ok("✓ up to date")}\n`);
        } else {
            process.stdout.write(`\r  ${col.warn("↑ v" + latest + " available")} — run ${col.cyan("npx goshipit@latest")} to update\n`);
        }
    } else {
        process.stdout.write(`\r  ${col.dim("(could not reach npm)")}\n`);
    }

    console.log(`\n  Installed on:`);
    for (const p of PLATFORMS) {
        const installed = p.installedAt();
        const icon = installed ? col.ok("✅") : col.dim("⚪");
        const note = installed ? col.dim("v" + VERSION) : col.dim("not installed");
        console.log(`    ${icon} ${p.label.padEnd(18)} ${note}`);
    }
    console.log();
}

// ─── --status ────────────────────────────────────────────────────────────────

function showStatus() {
    console.log(`\n  ${col.bold("goshipit")} ${col.cyan("v" + VERSION)} — status\n`);
    console.log(`  ${"Platform".padEnd(20)} ${"Detected".padEnd(10)} ${"Installed".padEnd(6)}  Path`);
    console.log(`  ${"─".repeat(72)}`);
    for (const p of PLATFORMS) {
        const detected   = p.detect();
        const installed  = p.installedAt();
        const dRaw = detected  ? "yes" : "no";
        const iRaw = installed ? "yes" : "no";
        const installPath = installed
            ? (p.uninstallPaths && p.uninstallPaths[0]
                ? p.uninstallPaths[0].replace(home, "~")
                : "settings.json")
            : "";
        console.log(
            `  ${p.label.padEnd(20)} ` +
            `${padCol(dRaw, 10, detected  ? col.ok : col.dim)} ` +
            `${padCol(iRaw, 6,  installed ? col.ok : col.dim)}  ` +
            `${installed ? col.dim(installPath) : ""}`
        );
    }
    const sharedOk = dirExists(sharedRefs);
    console.log(`\n  Shared refs: ${sharedOk ? col.ok("✅ " + sharedRefs) : col.dim("not found")}\n`);
}

// ─── interactive picker ──────────────────────────────────────────────────────

async function pickPlatforms(mode) {
    const uninstallMode = mode === "uninstall";

    const rows = PLATFORMS.map((p, i) => {
        const detected  = p.detect();
        const installed = p.installedAt();
        const badge = uninstallMode
            ? (installed ? col.ok("🗑️  installed")       : col.dim("⚪ not installed"))
            : (detected  ? col.ok("✅ detected")         : col.dim("⚪ not detected"));
        return { index: i + 1, platform: p, detected, installed, badge };
    });

    console.log(`
  ${col.bold("╔══════════════════════════════════════════════════════╗")}
  ${col.bold("║")}          🚀  ${col.cyan("goshipit")} — Pre-launch Audit             ${col.bold("║")}
  ${col.bold("╚══════════════════════════════════════════════════════╝")}
`);
    console.log(uninstallMode
        ? `  ${col.bold("Select AI tools to uninstall:")}\n`
        : `  ${col.bold("Select AI tools to install:")}\n`);

    for (const row of rows) {
        console.log(`    [${row.index}] ${row.platform.label.padEnd(18)} ${row.badge}`);
    }

    const hint = uninstallMode
        ? `\n  Numbers (e.g. "1,3"), "all", or ${col.dim("Enter")} for installed only: `
        : `\n  Numbers (e.g. "1,3"), "all", or ${col.dim("Enter")} for detected only: `;

    if (isYes || !isTTY) {
        const autoLabel = uninstallMode ? "(auto: installed only)" : "(auto: detected only)";
        console.log(`${hint}${col.dim(autoLabel)}`);
        return rows.filter(r => uninstallMode ? r.installed : r.detected).map(r => r.platform);
    }

    const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
    const input = await askLine(iface, hint);
    iface.close();

    const t = input.trim().toLowerCase();
    if (!t) {
        return rows.filter(r => uninstallMode ? r.installed : r.detected).map(r => r.platform);
    } else if (t === "all" || t === "a") {
        return PLATFORMS;
    } else {
        const indices = parseSelection(t, PLATFORMS.length);
        return indices.map(i => PLATFORMS[i]);
    }
}

// ─── run install ─────────────────────────────────────────────────────────────

async function runInstall(selected) {
    if (!fs.existsSync(srcSkill)) {
        console.error(col.err("\nError: SKILL.md not found. Reinstall: npm install -g goshipit"));
        process.exit(1);
    }

    if (isDryRun) console.log(`\n  ${col.warn("[dry-run] no files will be written")}\n`);

    installSharedRefs();

    const results = [];

    for (const platform of selected) {
        const wasInstalled = platform.installedAt();
        const action = wasInstalled ? "updated" : "installed";
        try {
            const dest = platform.install();
            const ok   = isDryRun || verifyFile(dest);
            results.push({ platform, status: ok ? "ok" : "verify-fail", dest, action });
        } catch (e) {
            results.push({ platform, status: "err", error: e.message, action });
        }
    }

    // Check for newer version (non-blocking, best-effort)
    const latestPromise = fetchLatestVersion();

    const ok = results.filter(r => r.status === "ok");
    console.log(`\n  ${col.ok("✅ goshipit " + (isDryRun ? "[dry-run]" : "installed!"))}\n`);
    console.log(`  Shared checks: ${col.dim(sharedRefs)}\n`);
    console.log(`  Results:`);

    for (const r of results) {
        const label = r.platform.label.padEnd(18);
        if (r.status === "ok") {
            const tag = r.action === "updated"
                ? col.cyan("(updated v" + VERSION + ")")
                : col.dim("(v" + VERSION + ")");
            console.log(`    ${col.ok("✅")} ${label} ${col.dim(r.dest)} ${tag}`);
        } else if (r.status === "verify-fail") {
            console.log(`    ${col.warn("⚠")}  ${label} ${col.warn("installed but file verification failed — check permissions")}`);
        } else {
            console.log(`    ${col.err("❌")} ${label} ${col.err("ERROR: " + r.error)}`);
        }
        // Per-platform notes (e.g. Cline manual step)
        if (r.status === "ok" && r.platform.note) console.log(r.platform.note);
    }

    if (ok.length > 0) {
        console.log(`\n  Usage:`);
        for (const r of ok) console.log(`    • ${r.platform.usage}`);
    }

    // Version check result
    const latest = await latestPromise;
    if (latest && latest !== VERSION) {
        console.log(`\n  ${col.warn("↑ v" + latest + " available")} — run ${col.cyan("npx goshipit@latest")} to update`);
    }

    console.log(`
  Uninstall: ${col.cyan("npx goshipit --uninstall")}
  Update:    ${col.cyan("npx goshipit@latest")}
  Status:    ${col.cyan("npx goshipit --status")}
`);
}

// ─── run uninstall ────────────────────────────────────────────────────────────

function runUninstall(selected) {
    if (isDryRun) console.log(`\n  ${col.warn("[dry-run] no files will be removed")}\n`);

    const results = [];

    for (const platform of selected) {
        const removed = platform.uninstallPaths.filter(removePath);
        if (platform.uninstallHook) platform.uninstallHook();
        results.push({ platform, status: removed.length > 0 ? "ok" : "skip" });
    }

    // Remove shared dir only if ALL platforms being uninstalled
    const allKeys     = new Set(PLATFORMS.map(p => p.key));
    const selectedKeys = new Set(selected.map(p => p.key));
    const allSelected = [...allKeys].every(k => selectedKeys.has(k));
    let sharedRemoved = false;
    if (allSelected) sharedRemoved = removePath(sharedDir);

    console.log(`\n  ${col.ok("🗑️  goshipit uninstalled!")}\n`);

    for (const r of results) {
        const label = r.platform.label.padEnd(18);
        if (r.status === "ok")   console.log(`    ${col.ok("✅")} ${label} removed`);
        else                     console.log(`    ${col.dim("⏭️ ")} ${label} ${col.dim("not found (already clean)")}`);
    }
    if (sharedRemoved) console.log(`    ${col.ok("✅")} ${"shared refs".padEnd(18)} ${sharedDir} removed`);

    console.log(`\n  Reinstall anytime: ${col.cyan("npx goshipit")}\n`);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
    if (isHelp)    { showHelp(); return; }
    if (isVersion) { await showVersion(); return; }
    if (isStatus)  { showStatus(); return; }

    const selected = await pickPlatforms(isUninstall ? "uninstall" : "install");

    if (selected.length === 0) {
        console.log(`\n  ${col.dim("Nothing selected. Exiting.")}\n`);
        process.exit(0);
    }

    if (isUninstall) runUninstall(selected);
    else             await runInstall(selected);
}

main().catch(e => { console.error(col.err(e.message)); process.exit(1); });
