#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

const src = path.join(__dirname, "..", "goshipit", "SKILL.md");
const dest = path.join(os.homedir(), ".claude", "skills", "goshipit", "SKILL.md");
const destDir = path.dirname(dest);

if (!fs.existsSync(src)) {
  console.error("Error: SKILL.md not found in package. Reinstall goshipit.");
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);

console.log(`
✅ goshipit skill installed!

Location: ${dest}

Usage in Claude Code:
  /goshipit

Run before every production deploy to audit 170+ checks across
secrets, security, code quality, tests, build, SEO, legal, and more.

Update anytime: npx goshipit@latest
`);
