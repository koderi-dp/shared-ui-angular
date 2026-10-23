import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { extname, join, normalize } from 'node:path'

/**
 * Serves public/r over HTTP, so a consumer can point its components.json at
 * http://localhost:5181/r/{name}.json while the registry is being worked on.
 * On GitHub the same files are read over raw.githubusercontent.com.
 */
const root = fileURLToPath(new URL('../public/r/', import.meta.url))
const port = Number(process.env.PORT ?? 5181)

const types = {
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

createServer(async (request, response) => {
  // The registry URL is /r/{name}.json; everything after /r/ is a file in public/r.
  const name = decodeURIComponent(
    new URL(request.url ?? '/', 'http://localhost').pathname
  )
  const relative = normalize(name).replace(/^[/\\](r)?[/\\]?/, '')
  const path = join(root, relative.replace(/^(\.\.[/\\])+/, ''))

  try {
    const body = await readFile(path)
    response.writeHead(200, {
      'content-type': types[extname(path)] ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
    })
    response.end(body)
  } catch {
    response.writeHead(404, {
      'content-type': 'application/json; charset=utf-8',
    })
    response.end(JSON.stringify({ error: `No registry item at ${name}` }))
  }
}).listen(port, () => {
  console.log(`Registry at http://localhost:${port}/r/{name}.json`)
  console.log(`Serving ${root}`)
})
