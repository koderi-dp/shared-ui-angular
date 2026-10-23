// Stamps the release version from a git tag (`v1.2.3`) into a package.json.
// Usage: node scripts/set-version.mjs <tag> [packageJsonPath=dist/ui/package.json]
import { readFileSync, writeFileSync } from 'node:fs'

const [tag = '', file = 'dist/ui/package.json'] = process.argv.slice(2)
const match = /^v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag)

if (!match) {
  console.error(`Not a release tag: ${tag}`)
  process.exit(1)
}

const pkg = JSON.parse(readFileSync(file, 'utf8'))
pkg.version = match[1]
writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n')
console.log(match[1])
