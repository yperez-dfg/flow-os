// scripts/gen-icons.mjs
// Generates minimal placeholder PNG icons using canvas or sharp if available,
// otherwise creates the smallest valid PNG (1x1 dark pixel) and copies it
import { writeFileSync, mkdirSync } from 'fs'

// Minimal valid 1x1 dark blue PNG (base64 encoded)
const minimalPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/192.png', minimalPng)
writeFileSync('public/icons/512.png', minimalPng)
writeFileSync('public/icons/maskable.png', minimalPng)
console.log('Placeholder icons created')
