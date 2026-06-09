import packageJson from '../../../package.json'

/** Build-time kimlik — client bundle ile /api/app-version karşılaştırması için. */
export function resolveBuildId(): string {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.CF_PAGES_COMMIT_SHA
  if (sha) return sha.slice(0, 7)
  return `${packageJson.version}-dev`
}

export const APP_BUILD_ID = resolveBuildId()
