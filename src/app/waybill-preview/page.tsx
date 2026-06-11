'use client'

// Dev-only design harness for the waybill PDF. Not linked from the app and
// returns 404 in production builds.

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { generateWaybillPDF } from '@/components/WaybillTemplate'
import type { WaybillFormData } from '@/lib/types'

type Mode = 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'

const HOURS = 60 * 60 * 1000

function buildSampleData(mode: Mode): WaybillFormData {
  const now = Date.now()
  const origin = mode === 'SEA' ? 'Shanghai/CNSHA' : 'Shanghai/PVG'
  const destination = mode === 'SEA' ? 'London/GBLON' : 'London/LHR'
  const stages =
    mode === 'SEA'
      ? ['Shipment Received', 'Port Processing', 'Vessel Departed', 'Ocean Transit', 'Arrived at Destination Port', 'Port Clearance', 'Delivered']
      : ['Shipment Received', 'Export Processing', 'Departed Origin Airport', 'In Transit', 'Arrived at Destination Airport', 'Import Clearance', 'Delivered']
  const spacing = mode === 'SEA' ? 36 : 14
  const currentStage = 3
  const trackingEvents = stages.map((status, i) => ({
    status,
    location: i < 3 ? origin : i < 5 ? 'Dubai/DXB' : destination,
    description: `${status} milestone.`,
    eventTime: new Date(now + (i - currentStage) * spacing * HOURS - 2 * HOURS).toISOString(),
    isHold: false,
  }))

  const prefix = mode === 'AIR' ? 'PP-AWB' : mode === 'SEA' ? 'PP-SWB' : mode === 'LAND' ? 'PP-LWB' : 'PP-DTD'

  return {
    waybillNumber: `${prefix}-2026-K8F2417`,
    trackingNumber: `${prefix.replace('PP-', '')}-9X4Q-2026`,
    consignmentNumber: 'PP-MBQK4T7',
    transportMode: mode,
    dateOfIssue: new Date(now - (currentStage * spacing + 2) * HOURS).toISOString(),
    estimatedArrivalDate: new Date(now + (stages.length - 1 - currentStage) * spacing * HOURS).toISOString(),
    issuingCarrier: mode === 'SEA' ? 'Parcel Point / Maersk Line' : 'Parcel Point / Emirates SkyCargo',
    carrierReference: mode === 'SEA' ? 'MAEU2204917' : 'EK176-40233181',
    flightNumber: 'EK202 / EK029',
    voyageNumber: 'V.418W',
    routeNumber: 'RT-AIR-PVG-LHR-2417',
    portOfDeparture: origin,
    portOfDestination: destination,
    currentStatus: stages[currentStage],
    currentLocation: 'Dubai/DXB',
    paymentStatus: 'PAID',
    serviceTypeString: 'Express',
    currency: 'USD',
    declaredValue: 12850,
    shipperName: 'Hangzhou Precision Components Ltd.',
    shipperPhone: '+86 571 8841 2207',
    shipperEmail: 'exports@hzprecision.cn',
    shipperAddress: 'Building 7, Binjiang Industrial Park, 318 Jiangling Road, Hangzhou, Zhejiang 310051, China',
    consigneeName: 'Northgate Engineering (UK) Ltd.',
    consigneePhone: '+44 20 7946 0958',
    consigneeEmail: 'goods-in@northgate-eng.co.uk',
    consigneeAddress: 'Unit 12, Riverside Business Estate, 44 Wharf Road, London N1 7UX, United Kingdom',
    receiverCity: 'London',
    cargoDescription: 'CNC-machined aluminium housings',
    specialInstructions: 'Fragile precision parts — keep upright. Receiver requires 30 minutes notice before delivery. Tail-lift vehicle needed at destination.',
    totalPieces: 14,
    totalWeight: 186.4,
    items: [
      { noOfPcs: 8, typeOfPkg: 'Carton', description: 'CNC-machined aluminium housings, anodized', grossWeight: 96.2, value: 7400, dimensions: { length: 60, width: 40, height: 35 } },
      { noOfPcs: 4, typeOfPkg: 'Crate', description: 'Stainless steel drive shafts, packed in foam', grossWeight: 71.8, value: 4150, dimensions: { length: 120, width: 30, height: 30 } },
      { noOfPcs: 2, typeOfPkg: 'Box', description: 'Calibration tooling and spare seals kit', grossWeight: 18.4, value: 1300, dimensions: { length: 45, width: 35, height: 25 } },
    ],
    trackingEvents,
  }
}

function blobUrlToBase64(url: string): Promise<string> {
  return fetch(url)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '')
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
    )
}

export default function WaybillPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound()

  // Initial mode can be set via ?mode=SEA for scripted captures
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'AIR'
    const m = new URLSearchParams(window.location.search).get('mode')?.toUpperCase()
    return m === 'SEA' || m === 'LAND' || m === 'DOOR_TO_DOOR' ? (m as Mode) : 'AIR'
  })
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBase64, setPdfBase64] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let createdUrl: string | null = null
    generateWaybillPDF(buildSampleData(mode))
      .then(async (url) => {
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        createdUrl = url
        const b64 = await blobUrlToBase64(url)
        if (cancelled) return
        setError(null)
        setPdfUrl(url)
        setPdfBase64(b64)
        // Fire-and-forget dump for headless design verification; no-op when
        // no listener is running. text/plain keeps it a simple CORS request.
        fetch('http://localhost:4789/dump', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: b64,
        }).catch(() => {})
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to generate PDF')
      })
    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [mode])

  return (
    <div className="min-h-screen bg-[#071427] p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-white font-bold text-lg mr-4">Waybill PDF Preview (dev only)</h1>
          {(['AIR', 'SEA', 'LAND', 'DOOR_TO_DOOR'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === m ? 'bg-[#7C3AED] text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {m === 'DOOR_TO_DOOR' ? 'Door to Door' : m}
            </button>
          ))}
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold bg-white/10 text-white/80 hover:bg-white/20">
              Open PDF
            </a>
          )}
        </div>
        {error && <p className="text-red-300 text-sm">{error}</p>}
        {pdfUrl ? (
          <iframe src={`${pdfUrl}#zoom=90`} title="Waybill preview" className="w-full h-300 rounded-xl border border-white/20 bg-white" />
        ) : (
          !error && <p className="text-white/50 text-sm">Generating…</p>
        )}
        {/* Base64 copy of the PDF for headless tooling to extract via --dump-dom */}
        {pdfBase64 && (
          <pre id="waybill-pdf-b64" data-mode={mode} className="hidden">
            {pdfBase64}
          </pre>
        )}
      </div>
    </div>
  )
}
