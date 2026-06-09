import { NextResponse } from 'next/server'
import {
  getWaybillByNumber,
  getWaybillErrorMessage,
  isWaybillServiceError,
  normalizeWaybillLookupInput,
} from '@/services/waybillService'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const waybillNumber = normalizeWaybillLookupInput(id || '')

  if (!waybillNumber) {
    return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 })
  }

  try {
    const result = await getWaybillByNumber(waybillNumber)
    if (!result) {
      return NextResponse.json({ error: 'Tracking number not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[api/track] failed to load waybill', error)
    if (isWaybillServiceError(error)) {
      if (error.kind === 'invalid_input') {
        return NextResponse.json({ error: getWaybillErrorMessage(error, 'tracking lookup') }, { status: 400 })
      }
      if (error.kind === 'permission' || error.kind === 'config') {
        return NextResponse.json({ error: getWaybillErrorMessage(error, 'tracking lookup') }, { status: 403 })
      }
      if (error.kind === 'timeout' || error.kind === 'network' || error.kind === 'unavailable') {
        return NextResponse.json({ error: getWaybillErrorMessage(error, 'tracking lookup') }, { status: 503 })
      }
    }

    return NextResponse.json({ error: getWaybillErrorMessage(error, 'tracking lookup') }, { status: 500 })
  }
}
