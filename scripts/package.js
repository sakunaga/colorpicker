#!/usr/bin/env node

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../src/manifest.json"), "utf8"))
const version = manifest.version
const zipName = `kpicker_v${version}.zip`
const root = path.join(__dirname, "..")
const distDir = path.join(root, "dist")

// Remove old version zip files
const oldZips = fs.readdirSync(root).filter((f) => f.startsWith("kpicker_v") && f.endsWith(".zip"))
for (const f of oldZips) {
  fs.unlinkSync(path.join(root, f))
  console.log(`Removed: ${f}`)
}

if (!fs.existsSync(distDir)) {
  console.error("Error: dist folder not found. Run 'npm run dist' first.")
  process.exit(1)
}

const tempDir = path.join(__dirname, `../kpicker_v${version}`)
try {
  fs.cpSync(distDir, tempDir, { recursive: true })
  execSync(`zip -r "${zipName}" "kpicker_v${version}"`, {
    cwd: root,
    stdio: "inherit",
  })
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true })
}

console.log(`\nCreated: ${zipName}`)
