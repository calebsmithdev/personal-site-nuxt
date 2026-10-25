import { securityHeaders } from '../config/security-headers.ts'

for (const [name, value] of Object.entries(securityHeaders)) {
  console.log(`${name}: ${value}`)
}
