import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const VITE_URL = 'http://localhost:5173'

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts })
}

async function waitForVite() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(VITE_URL)
      if (res.ok || res.status === 404) return true
    } catch {
      // not ready yet
    }
    await sleep(200)
  }
  throw new Error('Vite dev server did not start in time')
}

const vite = run('npx', ['vite'])

let electron
let shuttingDown = false

function shutdown(code) {
  if (shuttingDown) return
  shuttingDown = true
  if (electron && !electron.killed) electron.kill()
  if (vite && !vite.killed) vite.kill()
  process.exit(code ?? 0)
}

vite.on('exit', (code) => shutdown(code ?? 0))
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

try {
  await waitForVite()
} catch (err) {
  console.error(err)
  shutdown(1)
}

electron = run('npx', ['electron', '.'], {
  env: { ...process.env, NODE_ENV: 'development', VITE_DEV_SERVER_URL: VITE_URL },
})

electron.on('exit', (code) => shutdown(code ?? 0))
