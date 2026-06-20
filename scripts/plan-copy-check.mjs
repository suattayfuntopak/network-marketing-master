#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const result = spawnSync(
  'npx',
  ['vitest', 'run', 'src/lib/domain/planFeatureMatrix.test.ts'],
  { stdio: 'inherit', shell: false },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

console.log('✅ plan copy sync OK')
