import fs from 'fs'
import crypto from 'crypto'

// Encryption settings
const algorithm = 'aes-256-cbc'
const key = crypto.randomBytes(32) // store and reuse this securely
const iv = crypto.randomBytes(16)

export const encryptFile = (inputPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    const input = fs.createReadStream(inputPath)
    const output = fs.createWriteStream(outputPath)
    input.pipe(cipher).pipe(output)
    output.on('finish', resolve)
    output.on('error', reject)
  })
}
