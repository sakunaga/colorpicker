#!/usr/bin/env node

const fs = require("fs")
const path = require("path")

const root = path.join(__dirname, "..")
const src = path.join(root, "src")
const dist = path.join(root, "dist")

// Sync package.json version from manifest.json
const manifestPath = path.join(src, "manifest.json")
const pkgPath = path.join(root, "package.json")
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
if (pkg.version !== manifest.version) {
  pkg.version = manifest.version
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
  console.log(`package.json version synced to ${manifest.version}`)
}

// Clean and create dist structure
fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(path.join(dist, "styles"), { recursive: true })
fs.mkdirSync(path.join(dist, "scripts"), { recursive: true })

// Copy files
fs.copyFileSync(path.join(src, "manifest.json"), path.join(dist, "manifest.json"))
fs.copyFileSync(path.join(src, "index.html"), path.join(dist, "index.html"))
fs.copyFileSync(path.join(src, "css/style.css"), path.join(dist, "styles/style.css"))
fs.copyFileSync(path.join(src, "css/tailwind.css"), path.join(dist, "styles/tailwind.css"))
fs.copyFileSync(path.join(src, "scripts/index.js"), path.join(dist, "scripts/index.js"))
fs.copyFileSync(path.join(src, "scripts/background.js"), path.join(dist, "scripts/background.js"))
fs.cpSync(path.join(src, "icons"), path.join(dist, "icons"), { recursive: true })

// Update index.html paths
let html = fs.readFileSync(path.join(dist, "index.html"), "utf8")
html = html
  .replace(/href="css\/tailwind\.css"/g, 'href="styles/tailwind.css"')
  .replace(/href="css\/style\.css"/g, 'href="styles/style.css"')
  .replace(/src="scripts\/index\.js"/g, 'src="scripts/index.js"')
fs.writeFileSync(path.join(dist, "index.html"), html)

console.log("dist/ created successfully")
