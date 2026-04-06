import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const KEY_LENGTH = 64

export const hashSecret = (value: string) => {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(value, salt, KEY_LENGTH)

  return `${salt}:${derivedKey.toString('hex')}`
}

export const verifySecret = (value: string, storedHash?: string | null) => {
  if (!storedHash) {
    return false
  }

  const [salt, keyHex] = storedHash.split(':')

  if (!salt || !keyHex) {
    return false
  }

  const expectedKey = Buffer.from(keyHex, 'hex')
  const actualKey = scryptSync(value, salt, expectedKey.length)

  if (expectedKey.length !== actualKey.length) {
    return false
  }

  return timingSafeEqual(expectedKey, actualKey)
}
