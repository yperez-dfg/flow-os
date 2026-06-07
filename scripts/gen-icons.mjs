// scripts/gen-icons.mjs
// Generates proper PWA icons using sharp
import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const sizes = [
  { size: 192, path: 'public/icons/192.png' },
  { size: 512, path: 'public/icons/512.png' },
  { size: 512, path: 'public/icons/maskable.png' },
]

for (const { size, path } of sizes) {
  const r = Math.round(size * 0.2)
  const inner = Math.round(size * 0.35)
  const cx = size / 2
  const cy = size / 2
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${r}" fill="#F5F5F7"/>
    <rect x="${cx - inner}" y="${cy - inner}" width="${inner * 2}" height="${inner * 2}" rx="${Math.round(inner * 0.3)}" fill="#1560FF"/>
    <text x="${cx}" y="${cy + inner * 0.35}" font-family="Arial,sans-serif" font-size="${inner}"
          font-weight="bold" fill="white" text-anchor="middle">F</text>
  </svg>`
  await sharp(Buffer.from(svg)).png().toFile(path)
  console.log(`Created ${path}`)
}
console.log('Icons generated ✓')
