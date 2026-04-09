import { z } from 'zod'

export const mobileSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number')

export const aadhaarSchema = z.string()
  .regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits')

export const panSchema = z.string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be in format ABCDE1234F')

export function validateID(type, value) {
  if (!value) return 'ID number is required'
  if (type === 'aadhaar') {
    const result = aadhaarSchema.safeParse(value)
    return result.success ? null : result.error.errors[0].message
  }
  if (type === 'pan') {
    const result = panSchema.safeParse(value.toUpperCase())
    return result.success ? null : result.error.errors[0].message
  }
  if (value.trim().length < 3) return 'ID number is required'
  return null
}

export function validateMobile(value) {
  const result = mobileSchema.safeParse(value)
  return result.success ? null : result.error.errors[0].message
}
