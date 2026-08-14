#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const pkgRoot = path.join(__dirname, "..");
const srcSkill = path.join(pkgRoot, "goshipit", "SKILL.md");
const srcRefs = path.join(pkgRoot, "goshipit", "references");

const skillDir = path.join(os.homedir(), ".claude", "skills", "goshipit");
const destSkill = path.join(skillDir, "SKILL.md");
const destRefs = path.join(skillDir, "references");

if (!fs.existsSync(srcSkill)) {
    console.error("Error: SKILL.md not found in package. Reinstall goshipit.");
    process.exit(1);
}

fs.mkdirSync(skillDir, { recursive: true });
fs.copyFileSync(srcSkill, destSkill);

if (fs.existsSync(srcRefs)) {
    fs.mkdirSync(destRefs, { recursive: true });
    for (const file of fs.readdirSync(srcRefs)) {
        fs.copyFileSync(path.join(srcRefs, file), path.join(destRefs, file));
    }
}

console.log(`
✅ goshipit skill installed!

Location: ${skillDir}

Usage in Claude Code — say any of:
  goshipit
  is my app ready?
  can I deploy now?
  prelaunch check

Runs 196 checks across secrets, security, code quality,
tests, build, performance, SEO, legal, and more.

Update anytime: npx goshipit@latest
`);
