export default {
  extends: ['@commitlint/config-conventional'],
  // Dependabot writes "Bump …" subjects and long changelog links in bodies.
  ignores: [message => message.includes('Signed-off-by: dependabot[bot]')]
}
