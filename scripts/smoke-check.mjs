import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()

const requiredFiles = [
  'src/router.tsx',
  'src/lib/contacts/queries.ts',
  'src/pages/dashboard/contacts/ContactsListPage.tsx',
  'src/pages/dashboard/pipeline/PipelinePage.tsx',
]

const checks = [
  {
    file: 'src/router.tsx',
    includes: ['ROUTES.DASHBOARD', 'ROUTES.CONTACTS', 'ROUTES.PIPELINE', 'ROUTES.MESSAGES'],
  },
  {
    file: 'src/lib/contacts/queries.ts',
    includes: ['fetchContactsForExport', 'fetchProcessContacts', 'fetchContactSummaryCounts'],
  },
  {
    file: 'src/pages/dashboard/contacts/ContactsListPage.tsx',
    includes: ['fetchContactsForExport', 'useContactSummaryCounts'],
  },
  {
    file: 'src/pages/dashboard/pipeline/PipelinePage.tsx',
    includes: ['useProcessContacts'],
  },
]

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    console.error(`[smoke] Missing required file: ${file}`)
    process.exit(1)
  }
}

for (const check of checks) {
  const content = readFileSync(join(root, check.file), 'utf8')

  for (const token of check.includes) {
    if (!content.includes(token)) {
      console.error(`[smoke] Expected "${token}" in ${check.file}`)
      process.exit(1)
    }
  }
}

console.log('[smoke] Critical route and data-flow checks passed.')
