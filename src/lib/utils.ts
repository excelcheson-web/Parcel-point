import { generateTrackingId } from './constants'

// Deprecated, use generateTrackingId from constants.ts
export function generateTrackingNumber(): string {
  return generateTrackingId()
}
