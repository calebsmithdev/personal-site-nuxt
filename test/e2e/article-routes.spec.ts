import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url))
})

describe('article routes', () => {
  it('renders a known article document', async () => {
    const response = await fetch('/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs')
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain('Migrating Kubernetes PVCs from csi-proxmox to csi-cephfs')
    expect(html).toMatch(/<article\b[^>]*\bid="full-content"/)
  })

  it('returns not found for a guaranteed-missing article', async () => {
    const response = await fetch('/blog/__missing-characterization-article__')

    expect(response.status).toBe(404)
  })
})
