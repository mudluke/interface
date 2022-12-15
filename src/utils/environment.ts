export function isNonJestDev(
  isDevEnvironment = __DEV__,
  jestWorkerId: NullUndefined<string> = process.env.JEST_WORKER_ID
): boolean {
  return isDevEnvironment && !jestWorkerId
}
