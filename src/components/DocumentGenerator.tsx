'use client'

import { useCallback } from 'react'
import jsPDF from 'jspdf'
import type { DocumentConfig } from '@/lib/types'
import { generateTrackingId } from '@/lib/constants'

// Type declaration for qrcode
declare const QRCode: {
  toDataURL(text: string, options?: { width?: number }): Promise<string>
}

interface Props {
  data: DocumentConfig
}

export function DocumentGenerator({ data }: Props) {
  const generatePDF = useCallback(async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16 // High resolution
    })

    const A4_WIDTH = 210
    const A4_HEIGHT = 297
    const MARGIN = 15
    const CONTENT_WIDTH = A4_WIDTH - 2 * MARGIN

    // Header
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(data.companyName, MARGIN, 25)

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${data.type} | Tracking: ${data.trackingNumber || generateTrackingId()} | Status: ${data.status}`, MARGIN, 35)

    let y = 50

    // Items table
    pdf.setFontSize(14)
    pdf.text('Items', MARGIN, y)
    y += 10

    // Table header
    pdf.setFillColor(240, 240, 240)
    pdf.rect(MARGIN, y, CONTENT_WIDTH, 8, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.text('Description', MARGIN + 5, y + 6)
    pdf.text('Qty', MARGIN + 120, y + 6)
    pdf.text('Price', MARGIN + 140, y + 6)
    pdf.text('Total', MARGIN + 160, y + 6)
    y += 12

    pdf.setFont('helvetica', 'normal')
    let subtotal = 0
    data.items.forEach(item => {
      const itemTotal = item.quantity * (item.price || 0)
      subtotal += itemTotal
      pdf.text(item.description.slice(0, 60), MARGIN + 5, y, { maxWidth: 95 })
      pdf.text(item.quantity.toString(), MARGIN + 125, y)
      pdf.text(`$${ (item.price || 0).toFixed(2) }`, MARGIN + 145, y)
      pdf.text(`$${ itemTotal.toFixed(2) }`, MARGIN + 165, y)
      y += 8
    })

    // Totals
    y += 5
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Subtotal: $${subtotal.toFixed(2)}`, MARGIN + 120, y)
    y += 8
    pdf.text(`Total: $${subtotal.toFixed(2)}`, MARGIN + 120, y + 10)

    // Origin/Destination for Waybill
    if (data.type === 'WAYBILL') {
      y += 20
      pdf.setFontSize(12)
      pdf.text(`Origin: ${data.origin || 'N/A'}`, MARGIN, y)
      pdf.text(`Destination: ${data.destination || 'N/A'}`, MARGIN, y + 8)
      y += 20

      // QR Code bottom right - Waybill only
      const trackingId = data.trackingNumber || generateTrackingId()
      const qrData = `Tracking ID: ${trackingId} | Authenticated by Parcel Point System`
      try {
        const qrDataUrl = await QRCode.toDataURL(qrData, { width: 128 })
        pdf.addImage(qrDataUrl, 'PNG', A4_WIDTH - 45, A4_HEIGHT - 45, 30, 30)
        pdf.text('Scan to Verify', A4_WIDTH - 45, A4_HEIGHT - 25)
      } catch {
        pdf.setFillColor(200, 200, 200)
        pdf.rect(A4_WIDTH - 45, A4_HEIGHT - 45, 30, 30, 'F')
        pdf.setTextColor(100)
        pdf.text('QR', A4_WIDTH - 38, A4_HEIGHT - 35)
      }
    }

    // Footer signature/seal
    y = A4_HEIGHT - 30
    pdf.setLineWidth(0.5)
    pdf.line(MARGIN, y, MARGIN + 60, y)
    pdf.text('Authorized Signature', MARGIN, y + 8)
    pdf.setFontSize(10)
    pdf.circle(A4_WIDTH - 60, y - 5, 8)
    pdf.text('SEAL', A4_WIDTH - 65, y - 3)

    // Download - works on mobile/desktop
    pdf.save(`${data.type.toLowerCase()}_${data.trackingNumber || 'doc'}.pdf`)

    // Also create preview URL (blob)
    const pdfBlob = pdf.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    window.open(pdfUrl, '_blank') // PDF preview in new tab
  }, [data])

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <button
        onClick={generatePDF}
        className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all shadow-lg"
      >
        📄 Download & Preview PDF
      </button>
    </div>
  )
}

