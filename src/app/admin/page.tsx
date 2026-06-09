"use client";
import Image from "next/image";
import { CURRENCY_OPTIONS, formatCurrencyAmount, getCurrencyLabel } from "@/lib/currency";

import { useState, useRef, useEffect, useCallback } from "react";
type ReceiptItem = { description: string; quantity: number; unitPrice?: number; total?: number }
type PaymentMethod = 'Cash' | 'Bank Transfer' | 'POS' | 'Credit Card'
type CurrencyCode = typeof CURRENCY_OPTIONS[number]
type ReceiptFormat = 'classic' | 'modern' | 'minimal' | 'executive'

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['Cash', 'Bank Transfer', 'POS', 'Credit Card']

import type { DocumentConfig } from "@/lib/types";
import { SKYSHIP_CONFIG, generateTrackingId } from "@/lib/constants";
import generateDocumentPDF from "@/components/DocumentTemplate";
import SmartWaybillForm from "@/components/SmartWaybillForm";
import AdminTimelineControlPanel from "@/components/AdminTimelineControlPanel";
import { buildStoredWaybillFromFormData, createWaybill, getWaybillErrorMessage } from "@/services/waybillService";

const ADMIN_AUTH_KEY = 'parcelpoint_admin_auth'
const FALLBACK_ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME ?? 'ParcelAdmin'
const FALLBACK_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'PP-2026-Admin'
const LAST_RECEIPT_DOC_STORAGE_KEY = 'parcelpoint_last_receipt_doc'

function asSafeText(value: unknown, fallback: string): string {
  if (typeof value === 'string') { const t = value.trim(); return t || fallback }
  if (typeof value === 'number' || typeof value === 'boolean') { const t = String(value).trim(); return t || fallback }
  return fallback
}
function asOptionalText(value: unknown): string { return asSafeText(value, '') }

function formatPrintCurrency(currency: DocumentConfig['currency'], amount: number): string {
  return formatCurrencyAmount(currency || 'USD', amount)
}
function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// â”€â”€â”€ PREMIUM RECEIPT PRINT VIEW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ReceiptPrintViewProps { data: DocumentConfig; pdfUrl?: string | null; onBack: () => void }

function ReceiptPrintView({ data, pdfUrl, onBack }: ReceiptPrintViewProps) {
  const companyName = asSafeText(data.companyName, 'Company Name')
  const companyAddress = asSafeText(data.companyAddress, 'Not provided')
  const companyPhone = asSafeText(data.companyPhone, 'Not provided')
  const companyEmail = asSafeText(data.companyEmail, 'Not provided')
  const customerName = asSafeText(data.customerName, 'Customer Name')
  const customerAddress = asSafeText(data.customerAddress, 'Customer Address')
  const receiptNumber = asSafeText(data.receiptNumber, data.trackingNumber || 'N/A')
  const issueDate = asSafeText(data.dateOfIssue, new Date().toISOString().split('T')[0])
  const paymentMethod = asSafeText(data.paymentMethod, 'Not provided')
  const transferMode = asSafeText(data.transferMode, 'Not provided')
  const notes = asSafeText(data.notes, 'Payment is due as agreed. Please include receipt number on all payments.')
  const memo = asSafeText(data.receiptDescription || data.description, '-')
  const signeeName = asSafeText(data.signeeName, 'Authorized Signatory')
  const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0
  const paid = typeof data.paid === 'number' ? data.paid : 0
  const items = Array.isArray(data.items) ? data.items : []
  const rows = items.map((item, i) => {
    const quantity = Number(item.quantity) || 0
    const unitPrice = Number(item.price) || 0
    const total = quantity * unitPrice
    return { id: `${i}-${item.description}`, description: asSafeText(item.description, '-'), quantity, unitPrice, total }
  })
  const subtotal = rows.reduce((s, r) => s + r.total, 0)
  const tax = subtotal * (taxRate / 100)
  const grandTotal = subtotal + tax
  const balance = grandTotal - paid
  const fmt = data.receiptFormat || 'classic'
  const fmtLabel = { classic: 'Classic', modern: 'Modern', minimal: 'Minimal', executive: 'Executive' }[fmt]

  const handlePrintTap = useCallback(() => {
    try {
      if (typeof window.print === 'function') {
        let afterPrintFired = false
        window.addEventListener('afterprint', () => { afterPrintFired = true }, { once: true })
        window.print()
        if (isMobileBrowser()) {
          window.setTimeout(() => {
            if (!afterPrintFired) alert('If print dialog did not open, tap Open PDF Copy and use your browser menu to print.')
          }, 1200)
        }
        return
      }
    } catch (error) { console.error('Native print failed:', error) }
    if (pdfUrl) { window.location.href = pdfUrl; return }
    alert('Printing is not available in this browser. Open this page in Safari or Chrome and use Share > Print.')
  }, [pdfUrl])

  return (
    <div className="receipt-print-shell min-h-screen bg-[#eef2f7] px-3 py-4">
      <style jsx global>{`
        @media print {
          .receipt-print-shell { background: #fff !important; padding: 0 !important; }
          .receipt-print-actions { display: none !important; }
          .receipt-print-card { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; max-width: none !important; }
        }
      `}</style>

      <article className="receipt-print-card mx-auto w-full max-w-115 overflow-hidden rounded-xl border border-[#d7deea] bg-white shadow-sm">
        {/* Header band */}
        <div className="border-t-4 border-[#7C3AED] border-b border-[#d7deea] bg-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {data.logoUrl && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-[#d7deea] shrink-0">
                <Image src={data.logoUrl} alt="Logo" fill className="object-contain p-1" sizes="40px" unoptimized />
              </div>
            )}
            <div>
              <p className="text-[#071427] font-bold text-sm leading-tight">{companyName}</p>
              <p className="text-[#66758a] text-[10px] leading-tight">{companyPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#071427] font-black text-lg leading-none tracking-wide">RECEIPT</p>
            <p className="text-[#66758a] text-[10px] mt-0.5">{fmtLabel} Format</p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Receipt meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Receipt No.', receiptNumber],
              ['Issue Date', issueDate],
              ['Payment', paymentMethod],
              ['Transfer', transferMode],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#e3e8f0] bg-white p-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#5a7090] font-semibold mb-0.5">{label}</p>
                <p className="text-sm font-bold text-[#0d2340] leading-tight truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#d4deee] rounded-lg p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#071427] font-bold mb-1">From</p>
              <p className="text-xs font-bold text-[#0d2340]">{companyName}</p>
              <p className="text-[10px] text-[#506680] mt-0.5 leading-snug">{companyAddress}</p>
              <p className="text-[10px] text-[#506680] mt-0.5">{companyEmail}</p>
            </div>
            <div className="border border-[#d4deee] rounded-lg p-3">
              <p className="text-[9px] uppercase tracking-wider text-[#071427] font-bold mb-1">Bill To</p>
              <p className="text-xs font-bold text-[#0d2340]">{customerName}</p>
              <p className="text-[10px] text-[#506680] mt-0.5 leading-snug">{customerAddress}</p>
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto rounded-lg border border-[#d4deee]">
            <table className="w-full table-fixed text-xs">
              <thead>
                <tr className="bg-[#f3f6fb] text-[#071427]">
                  <th className="w-[48%] px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Description</th>
                  <th className="w-[12%] px-2 py-2 text-center text-[10px] font-bold uppercase">Qty</th>
                  <th className="w-[20%] px-2 py-2 text-right text-[10px] font-bold uppercase">Unit</th>
                  <th className="w-[20%] px-2 py-2 text-right text-[10px] font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? rows.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f9fd]'}>
                    <td className="border-b border-[#edf0f5] px-2 py-1.5 text-[#1a3550] font-medium wrap-break-word">{row.description}</td>
                    <td className="border-b border-[#edf0f5] px-2 py-1.5 text-center text-[#1a3550]">{row.quantity}</td>
                    <td className="border-b border-[#edf0f5] px-2 py-1.5 text-right text-[#1a3550]">{formatPrintCurrency(data.currency, row.unitPrice)}</td>
                    <td className="border-b border-[#edf0f5] px-2 py-1.5 text-right font-bold text-[#1a3550]">{formatPrintCurrency(data.currency, row.total)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-2 py-3 text-center text-[#80a0c0] text-xs">No line items.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-[#d4deee] overflow-hidden">
            {[
              ['Subtotal', formatPrintCurrency(data.currency, subtotal), false],
              [`VAT (${taxRate}%)`, formatPrintCurrency(data.currency, tax), false],
              ['Paid', formatPrintCurrency(data.currency, paid), false],
              ['Balance', formatPrintCurrency(data.currency, balance), false],
            ].map(([label, value, bold]) => (
              <div key={String(label)} className={`flex justify-between px-3 py-1.5 border-b border-[#edf0f5] ${bold ? 'font-bold' : ''}`}>
                <span className="text-xs text-[#506680]">{label}</span>
                <span className="text-xs text-[#1a3550]">{String(value)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t-2 border-[#7C3AED] bg-[#f3f6fb] px-3 py-2.5">
              <span className="text-sm font-bold text-[#071427]">Grand Total</span>
              <span className="text-sm font-black text-[#071427]">{formatPrintCurrency(data.currency, grandTotal)}</span>
            </div>
          </div>

          {/* Notes + memo */}
          <div className="rounded-lg border border-[#e3e8f0] bg-white p-3 space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#5a7090] font-semibold mb-0.5">Notes</p>
              <p className="text-xs text-[#506680] leading-relaxed">{notes}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#5a7090] font-semibold mb-0.5">Memo</p>
              <p className="text-xs text-[#506680] leading-relaxed">{memo}</p>
            </div>
          </div>

          {/* Signatory */}
          <div className="border-t border-dashed border-[#b8cade] pt-3 flex items-end justify-between">
            <div>
              {data.signatureUrl && (
                <div className="relative h-8 w-28 mb-1">
                  <Image src={data.signatureUrl} alt="Signature" fill className="object-contain object-left" sizes="112px" unoptimized />
                </div>
              )}
              <div className="w-32 border-b border-[#1a3550] mb-1" />
              <p className="text-xs font-bold text-[#1a3550]">{signeeName}</p>
              <p className="text-[10px] text-[#80a0c0]">Authorized Signatory</p>
            </div>
            {data.stampUrl && (
              <div className="relative w-16 h-16">
                <Image src={data.stampUrl} alt="Stamp" fill className="object-contain" sizes="64px" unoptimized />
              </div>
            )}
          </div>
        </div>

        {/* Footer band */}
        <div className="bg-[#f8fafc] border-t border-[#d4deee] px-5 py-3">
          <p className="text-[10px] text-[#80a0c0] text-center italic">Computer-generated document. Receipt format: {fmtLabel}.</p>
        </div>
      </article>

      {/* Actions */}
      <div className="receipt-print-actions mx-auto mt-4 flex w-full max-w-115 flex-col gap-2 sm:flex-row">
        <button type="button" onClick={handlePrintTap}
          className="flex-1 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#7C3AED]/30 hover:bg-[#6d28d9] transition-colors">
          Print Receipt
        </button>
        {pdfUrl && (
          <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 rounded-xl bg-[#0d2743] px-4 py-3 text-center text-sm font-bold text-white border border-[#2a4f7a] hover:bg-[#152f50] transition-colors">
            Open PDF Copy
          </a>
        )}
        <button type="button" onClick={onBack}
          className="flex-1 rounded-xl bg-[#1a3a5c] px-4 py-3 text-sm font-bold text-white/80 border border-[#2a5280] hover:bg-[#1f4570] transition-colors">
          â† Back
        </button>
      </div>
      <p className="mx-auto mt-2 w-full max-w-115 text-xs text-[#5a7090]">
        iPhone/Safari: if dialog does not show, tap <strong>Print Receipt</strong> again.
      </p>
    </div>
  )
}

// â”€â”€â”€ SECTION CARD â€” defined at module level so React never remounts it on state change â”€â”€
function SectionCard({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-[#A855F7] shrink-0">{icon}</span>
        <h3 className="text-sm font-bold text-white/90 uppercase tracking-wider">{label}</h3>
      </div>
      {children}
    </div>
  )
}

// â”€â”€â”€ ADMIN PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AdminPage() {
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const canUseFallback = useCallback((u: string, p: string) =>
    u.trim() === FALLBACK_ADMIN_USERNAME && p === FALLBACK_ADMIN_PASSWORD, [])

  const completeLogin = useCallback(() => {
    setIsAuthenticated(true); setLoginError(''); setLoginPassword('')
    try { window.sessionStorage.setItem(ADMIN_AUTH_KEY, 'true') } catch {}
  }, [])

  useEffect(() => {
    try { if (window.sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true') setIsAuthenticated(true) } catch {}
    setIsAuthReady(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const u = loginUsername.trim(), p = loginPassword
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username:u, password:p})
      })
      if (!res.ok) {
        if (canUseFallback(u,p)) { completeLogin(); return }
        setLoginError('Invalid username or password'); return
      }
      completeLogin()
    } catch {
      if (canUseFallback(u,p)) { completeLogin(); return }
      setLoginError('Unable to login right now. Please try again.')
    }
  }

  const handleLogout = () => {
    try { window.sessionStorage.removeItem(ADMIN_AUTH_KEY) } catch {}
    setIsAuthenticated(false); setLoginUsername(''); setLoginPassword(''); setLoginError('')
  }

  // â”€â”€ FORM STATE â”€â”€
  const [type, setType] = useState<'RECEIPT' | 'WAYBILL'>('RECEIPT')
  const [receiptFormat, setReceiptFormat] = useState<ReceiptFormat>('classic')
  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [origin] = useState('')
  const [destination] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [items, setItems] = useState<ReceiptItem[]>([])
  const [paid, setPaid] = useState(0)
  const [balance, setBalance] = useState(0)
  const [generated, setGenerated] = useState<DocumentConfig[]>([])
  const [isWaybillSaving, setIsWaybillSaving] = useState(false)
  const [waybillSaveError, setWaybillSaveError] = useState<string | null>(null)
  const [waybillSaveSuccess, setWaybillSaveSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [dateOfIssue, setDateOfIssue] = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [receiptDescription, setReceiptDescription] = useState('')
  const [signeeName, setSigneeName] = useState('')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [stampUrl, setStampUrl] = useState('')
  const [stampPreview, setStampPreview] = useState<string | null>(null)
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null)
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState<DocumentConfig | null>(null)
  const [printViewDoc, setPrintViewDoc] = useState<DocumentConfig | null>(null)
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const stampInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(LAST_RECEIPT_DOC_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as DocumentConfig
      if (parsed?.type === 'RECEIPT') setLastGeneratedDoc(parsed)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      if (!lastGeneratedDoc || lastGeneratedDoc.type !== 'RECEIPT') {
        window.sessionStorage.removeItem(LAST_RECEIPT_DOC_STORAGE_KEY); return
      }
      window.sessionStorage.setItem(LAST_RECEIPT_DOC_STORAGE_KEY, JSON.stringify(lastGeneratedDoc))
    } catch {}
  }, [lastGeneratedDoc])

  const addItem = useCallback(() =>
    setItems(prev => [...prev, {description:'', quantity:0, unitPrice:0, total:0}]), [])

  const updateItem = useCallback((index: number, field: keyof ReceiptItem, value: string | number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unitPrice')
        updated.total = (Number(updated.quantity)||0) * (Number(updated.unitPrice)||0)
      if (field === 'total' && Number(updated.quantity) > 0)
        updated.unitPrice = Number(updated.total) / Number(updated.quantity)
      return updated
    }))
  }, [])

  const removeItem = useCallback((index: number) =>
    setItems(prev => prev.filter((_,i) => i !== index)), [])

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please upload an image file (PNG, JPG, JPEG, GIF)'); return }
    if (file.size > 5*1024*1024) { alert('File size must be less than 5MB'); return }
    const reader = new FileReader()
    reader.onload = ev => { const b64 = ev.target?.result as string; setLogoUrl(b64); setLogoPreview(b64) }
    reader.onerror = () => alert('Error reading file. Please try again.')
    reader.readAsDataURL(file)
  }, [])

  const clearLogo = useCallback(() => {
    setLogoUrl(''); setLogoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleSignatureUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please upload an image file for the signature.'); return }
    if (file.size > 3*1024*1024) { alert('Signature file size must be less than 3MB'); return }
    const reader = new FileReader()
    reader.onload = ev => { const b64 = ev.target?.result as string; setSignatureUrl(b64); setSignaturePreview(b64) }
    reader.onerror = () => alert('Error reading signature file.')
    reader.readAsDataURL(file)
  }, [])

  const clearSignature = useCallback(() => {
    setSignatureUrl(''); setSignaturePreview(null)
    if (signatureInputRef.current) signatureInputRef.current.value = ''
  }, [])

  const handleStampUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('Please upload an image file for the stamp.'); return }
    if (file.size > 3*1024*1024) { alert('Stamp file size must be less than 3MB'); return }
    const reader = new FileReader()
    reader.onload = ev => { const b64 = ev.target?.result as string; setStampUrl(b64); setStampPreview(b64) }
    reader.onerror = () => alert('Error reading stamp file.')
    reader.readAsDataURL(file)
  }, [])

  const clearStamp = useCallback(() => {
    setStampUrl(''); setStampPreview(null)
    if (stampInputRef.current) stampInputRef.current.value = ''
  }, [])

  const toggleType = (newType: 'RECEIPT' | 'WAYBILL') => {
    setType(newType)
    if (newType === 'RECEIPT') {
      setCompanyName('')
      setLogoUrl(''); setLogoPreview(null)
      setCompanyAddress('')
      setCompanyPhone('')
      setCompanyEmail('')
    } else {
      setCompanyName(asSafeText(SKYSHIP_CONFIG.name, 'Company Name'))
      setLogoUrl(asOptionalText(SKYSHIP_CONFIG.logo)); setLogoPreview(null)
    }
  }

  const makeReceiptNumber = useCallback((name: string): string => {
    const initials = name.trim().split(/\s+/).filter(w => /\w/.test(w)).map(w => w[0].toUpperCase()).slice(0, 4).join('') || 'RCP'
    return `${initials}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  }, [])

  const buildReceiptDocument = useCallback((trackingNumber?: string): DocumentConfig => {
    const safeTracking = asSafeText(trackingNumber, generateTrackingId())
    const safeCompanyName = asSafeText(companyName, 'Company')
    const autoRcpNum = receiptNumber.trim() || makeReceiptNumber(safeCompanyName)
    const normalizedItems = items.map(item => {
      const quantity = Number(item.quantity)||0, unitPrice = Number(item.unitPrice)||0
      const total = Number(item.total)
      return { description:asOptionalText(item.description), quantity, unitPrice,
        total:Number.isFinite(total)?total:quantity*unitPrice, price:unitPrice }
    })
    if (!receiptNumber.trim()) setReceiptNumber(autoRcpNum)
    return {
      companyName: safeCompanyName,
      logoUrl: asOptionalText(logoUrl),
      type: 'RECEIPT',
      items: normalizedItems,
      origin: asOptionalText(origin),
      destination: asOptionalText(destination),
      trackingNumber: safeTracking,
      status: 'PENDING',
      receiptNumber: autoRcpNum,
      dateOfIssue: asSafeText(dateOfIssue, new Date().toISOString().split('T')[0]),
      paymentMethod, currency,
      companyAddress: asOptionalText(companyAddress),
      companyPhone: asOptionalText(companyPhone),
      companyEmail: asOptionalText(companyEmail),
      customerName: asOptionalText(customerName),
      customerAddress: asOptionalText(customerAddress),
      taxRate: Number(taxRate)||0,
      paid: Number(paid)||0,
      balance: Number(balance)||0,
      description: asOptionalText(receiptDescription),
      receiptDescription: asOptionalText(receiptDescription),
      signeeName: asSafeText(signeeName, 'Authorized Signatory'),
      signatureUrl: asOptionalText(signatureUrl),
      stampUrl: asOptionalText(stampUrl),
      receiptFormat,
    }
  }, [
    balance, companyAddress, companyEmail, companyName, companyPhone, currency,
    customerAddress, customerName, dateOfIssue, destination, items, logoUrl, makeReceiptNumber, origin,
    paid, paymentMethod, receiptDescription, receiptFormat, receiptNumber,
    signeeName, signatureUrl, stampUrl, taxRate,
  ])

  const generate = async () => {
    try {
      const trackingNumber = generateTrackingId()
      const doc: DocumentConfig = type === 'RECEIPT'
        ? buildReceiptDocument(trackingNumber)
        : {
            companyName, logoUrl: logoUrl||'', type, items: items.map(item=>({...item,price:item.unitPrice})),
            origin, destination, trackingNumber, status:'PENDING',
            receiptNumber: receiptNumber||trackingNumber,
            dateOfIssue: dateOfIssue||new Date().toISOString().split('T')[0],
            paymentMethod, currency, companyAddress, companyPhone, companyEmail,
            customerName, customerAddress, taxRate, paid, balance,
            description: receiptDescription, receiptDescription,
            signeeName: signeeName||'Authorized Signatory', signatureUrl, stampUrl, receiptFormat,
          }

      setLastGeneratedDoc(doc)
      setGenerated(prev => [doc, ...prev.slice(0,4)])

      try {
        const pdfUrl = await generateDocumentPDF(doc)
        setLastGeneratedUrl(pdfUrl)
        if (!isMobileBrowser()) {
          const link = document.createElement('a')
          link.href = pdfUrl; link.download = `${type.toLowerCase()}_${trackingNumber}.pdf`
          document.body.appendChild(link); link.click(); document.body.removeChild(link)
        }
        alert(`${type} generated successfully!`)
      } catch (pdfError) {
        console.error('PDF generation warning:', pdfError)
        setLastGeneratedUrl(null)
        alert(`${type} prepared for printing. PDF copy unavailable on this device/browser.`)
      }
    } catch (error) {
      console.error('Error generating:', error)
      alert(`Error generating ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handlePrint = () => {
    const hasLiveDraft = type === 'RECEIPT' && items.length > 0
    const draftDoc = hasLiveDraft ? buildReceiptDocument(lastGeneratedDoc?.trackingNumber) : null
    const targetDoc = draftDoc || lastGeneratedDoc
    if (!targetDoc || targetDoc.type !== 'RECEIPT') {
      alert('Add at least one item and generate or prepare a receipt before printing.'); return
    }
    if (draftDoc) setLastGeneratedDoc(draftDoc)
    setPrintViewDoc(targetDoc)
  }

  const subtotal = items.reduce((s, item) => s + (item.total||(item.quantity*(item.unitPrice||0))), 0)
  const tax = subtotal * (taxRate/100)
  const total = subtotal + tax

  useEffect(() => { setBalance(total - paid) }, [total, paid])

  // â”€â”€ RENDER GUARDS â”€â”€
  if (!isAuthReady) {
    return (
      <div className="admin-polish min-h-screen flex items-center justify-center">
        <div className="admin-muted text-sm">Loading admin accessâ€¦</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-polish min-h-screen flex items-center justify-center px-4 py-10">
        <div className="admin-login-card w-full max-w-105 p-8 sm:p-10">
          {/* Brand header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#7C3AED]/40 shadow-lg shadow-[#7C3AED]/20">
              <Image src="/parcel-point-logo.png" alt="Parcel Point" fill className="object-contain" sizes="64px" priority />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
              <p className="text-white/50 text-sm mt-0.5">Parcel Point Â· Secure Access</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Username</label>
              <input type="text" value={loginUsername} onChange={e => setLoginUsername(e.target.value)}
                className="w-full logistics-input-control px-4 py-3" placeholder="Enter admin username" autoComplete="username" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">Password</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                className="w-full logistics-input-control px-4 py-3" placeholder="Enter password" autoComplete="current-password" />
            </div>
            {loginError && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{loginError}</div>
            )}
            <button type="submit" className="admin-action-primary w-full rounded-xl py-3.5 font-bold transition mt-2">
              Sign In
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-white/25 text-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>256-bit SSL Â· Secured by Parcel Point</span>
          </div>
        </div>
      </div>
    )
  }

  if (printViewDoc) {
    return <ReceiptPrintView data={printViewDoc} pdfUrl={lastGeneratedUrl} onBack={() => setPrintViewDoc(null)} />
  }

  const inputCls = "w-full logistics-input-control px-3.5 py-2.5 text-sm"
  const selectCls = "w-full logistics-input-control px-3.5 py-2.5 text-sm"
  const labelCls = "block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5"

  // â”€â”€ MAIN DASHBOARD â”€â”€
  return (
    <div className="admin-polish flex min-h-full flex-col items-center py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl space-y-6">

        {/* â”€â”€ HEADER â”€â”€ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-[#7C3AED]/40 shadow-lg shadow-[#7C3AED]/20 shrink-0">
              <Image src="/parcel-point-logo.png" alt="Parcel Point" fill className="object-contain" sizes="48px" priority />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="admin-heading text-2xl sm:text-3xl font-black tracking-tight">Admin Dashboard</h1>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest"
                  style={{background:'rgba(124,58,237,0.18)',border:'1px solid rgba(124,58,237,0.4)',color:'#A855F7'}}>
                  PARCEL POINT
                </span>
              </div>
              <p className="admin-subtitle text-xs mt-0.5">Document Generation &amp; Waybill Management</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout}
            className="admin-action-secondary self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-semibold">
            Sign Out
          </button>
        </div>

        {/* â”€â”€ MAIN CARD â”€â”€ */}
        <div className="admin-main-card p-5 sm:p-7 lg:p-8 space-y-6">

          {/* â”€â”€ MODE TABS â”€â”€ */}
          <div className="flex gap-1 p-1 rounded-2xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
            {(['RECEIPT','WAYBILL'] as const).map(t => (
              <button key={t} onClick={() => toggleType(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  type === t ? 'admin-action-primary shadow-lg' : 'text-white/50 hover:text-white/80'
                }`}>
                {t === 'RECEIPT'
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                }
                {t === 'RECEIPT' ? 'Receipt' : 'Waybill'}
              </button>
            ))}
          </div>

          {/* â•â•â•â•â•â•â•â•â•â•â• RECEIPT MODE â•â•â•â•â•â•â•â•â•â•â• */}
          {type === 'RECEIPT' && (<>

            {/* SECTION 1: COMPANY IDENTITY */}
            <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>} label="Company Identity">
              <div className="flex flex-col sm:flex-row gap-5">
                {/* Logo upload */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-[#3a587f] bg-[#0d2540] flex items-center justify-center"
                    style={logoPreview ? {borderStyle:'solid',borderColor:'rgba(124,58,237,0.5)'} : {}}>
                    {logoPreview ? (
                      <Image src={logoPreview} alt="Logo" fill className="object-contain p-2" sizes="80px" unoptimized />
                    ) : logoUrl && !logoUrl.startsWith('data:') ? (
                      <Image src={logoUrl} alt="Logo" fill className="object-contain p-2" sizes="80px" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-white/25">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="admin-action-secondary px-3 py-1.5 rounded-lg text-xs font-semibold">
                      {logoPreview ? 'Change' : 'Upload'}
                    </button>
                    {logoPreview && (
                      <button type="button" onClick={clearLogo}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20">
                        Remove
                      </button>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <p className="text-[10px] text-white/30 text-center leading-tight">PNG/JPG â‰¤ 5MB<br/>Applied to all formats</p>
                </div>

                {/* Company fields */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className={labelCls}>Company Name</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                      className={inputCls} placeholder="Company name" />
                  </div>
                  <div>
                    <label className={labelCls}>Company Address</label>
                    <textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)}
                      rows={2} className={inputCls + ' resize-none'} placeholder="Full address" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input type="tel" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)}
                        className={inputCls} placeholder="+234 800 â€¦" />
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                        className={inputCls} placeholder="hello@company.com" />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* SECTION 2: RECEIPT SETTINGS + FORMAT */}
            <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} label="Receipt Settings">
              {/* Format picker */}
              <div>
                <label className={labelCls}>Receipt Format â€” logo change applies to all formats</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {([
                    {id:'classic',  label:'Classic',   sub:'Standard header and parties'},
                    {id:'modern',   label:'Modern',    sub:'Clean navy receipt layout'},
                    {id:'minimal',  label:'Minimal',   sub:'Typography-first receipt'},
                    {id:'executive',label:'Executive', sub:'Formal navy receipt'},
                  ] as const).map(f => (
                    <button key={f.id} type="button" onClick={() => setReceiptFormat(f.id)}
                      className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all ${
                        receiptFormat === f.id
                          ? 'border-[#7C3AED] bg-[#7C3AED]/15 shadow-inner'
                          : 'border-white/10 bg-white/3 hover:border-white/20'
                      }`}>
                      <span className={`text-xs font-bold ${receiptFormat===f.id?'text-[#A855F7]':'text-white/70'}`}>{f.label}</span>
                      <span className="text-[9px] text-white/35 leading-tight">{f.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Receipt Number</label>
                  <input type="text" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)}
                    className={inputCls} placeholder="e.g. RCP-2026-001" />
                </div>
                <div>
                  <label className={labelCls}>Date of Issue</label>
                  <input type="date" value={dateOfIssue} onChange={e => setDateOfIssue(e.target.value)}
                    className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Description / Memo</label>
                  <textarea value={receiptDescription} onChange={e => setReceiptDescription(e.target.value)}
                    rows={2} className={inputCls + ' resize-none'} placeholder="Receipt memo or description" />
                </div>
              </div>
            </SectionCard>

            {/* SECTION 3: CUSTOMER */}
            <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} label="Customer">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Customer Name</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                    className={inputCls} placeholder="Full name or company" />
                </div>
                <div>
                  <label className={labelCls}>Customer Address</label>
                  <input type="text" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                    className={inputCls} placeholder="Billing address" />
                </div>
              </div>
            </SectionCard>

            {/* SECTION 4: SIGN-OFF & STAMP */}
            <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>} label="Sign-off &amp; Stamp">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Signee Name</label>
                  <input type="text" value={signeeName} onChange={e => setSigneeName(e.target.value)}
                    className={inputCls} placeholder="e.g. Parcel Point Desk" />
                </div>
                <div>
                  <label className={labelCls}>Signature Image (Optional)</label>
                  <input ref={signatureInputRef} type="file" accept="image/*" onChange={handleSignatureUpload}
                    className="w-full text-xs text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#7C3AED]/20 file:text-[#A855F7] hover:file:bg-[#7C3AED]/30 cursor-pointer" />
                  {signaturePreview && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative w-24 h-10 rounded-lg overflow-hidden border border-[#3a587f] bg-white/5">
                        <Image src={signaturePreview} alt="Signature" fill className="object-contain p-1" sizes="96px" unoptimized />
                      </div>
                      <button onClick={clearSignature} className="text-xs text-red-300 border border-red-400/30 rounded-lg px-2 py-1 hover:bg-red-500/10">Remove</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Company Stamp (Optional)</label>
                  <input ref={stampInputRef} type="file" accept="image/*" onChange={handleStampUpload}
                    className="w-full text-xs text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#7C3AED]/20 file:text-[#A855F7] hover:file:bg-[#7C3AED]/30 cursor-pointer" />
                  {stampPreview && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#3a587f] bg-white/5">
                        <Image src={stampPreview} alt="Stamp" fill className="object-contain p-1" sizes="48px" unoptimized />
                      </div>
                      <button onClick={clearStamp} className="text-xs text-red-300 border border-red-400/30 rounded-lg px-2 py-1 hover:bg-red-500/10">Remove</button>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* SECTION 5: PAYMENT DETAILS */}
            <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="Payment Details">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Payment Method</label>
                  <select value={paymentMethod} onChange={e => { const v=e.target.value as PaymentMethod; if(PAYMENT_METHOD_OPTIONS.includes(v)) setPaymentMethod(v) }}
                    className={selectCls}>
                    {PAYMENT_METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Currency</label>
                  <select value={currency} onChange={e => { const v=e.target.value as CurrencyCode; if(CURRENCY_OPTIONS.includes(v)) setCurrency(v) }}
                    className={selectCls}>
                    {CURRENCY_OPTIONS.map((code) => (
                      <option key={code} value={code}>{getCurrencyLabel(code)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Paid Amount</label>
                  <input type="number" min="0" value={paid} onChange={e => setPaid(Number(e.target.value)||0)}
                    className={inputCls} placeholder="0.00" />
                </div>
                <div>
                  <label className={labelCls}>Balance (Auto)</label>
                  <input type="number" min="0" value={balance} readOnly
                    className={inputCls + ' opacity-60 cursor-not-allowed'} />
                </div>
              </div>
            </SectionCard>

            {/* SECTION 6: LINE ITEMS */}
            <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>} label="Line Items">
              <div className="flex justify-end mb-2">
                <button type="button" onClick={addItem}
                  className="admin-action-secondary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Item
                </button>
              </div>

              {items.length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-white/10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-white/20 mx-auto mb-2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <p className="text-white/30 text-sm">No items yet. Click Add Item to begin.</p>
                </div>
              )}

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl"
                    style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                    <div className="col-span-12 sm:col-span-5">
                      <label className={labelCls}>Description</label>
                      <input type="text" value={item.description}
                        onChange={e => updateItem(index,'description',e.target.value)}
                        className={inputCls} placeholder="Item description" />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className={labelCls}>Qty</label>
                      <input type="number" min="0" value={item.quantity}
                        onChange={e => updateItem(index,'quantity',parseInt(e.target.value)||0)}
                        className={inputCls + ' text-center'} />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className={labelCls}>Unit Price</label>
                      <input type="number" step="0.01" value={item.unitPrice||''}
                        onChange={e => updateItem(index,'unitPrice',parseFloat(e.target.value)||0)}
                        className={inputCls + ' text-right'} placeholder="0.00" />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className={labelCls}>Total</label>
                      <input type="number" step="0.01"
                        value={item.total||(item.quantity*(item.unitPrice||0))}
                        onChange={e => updateItem(index,'total',parseFloat(e.target.value)||0)}
                        className={inputCls + ' text-right font-mono'} placeholder="0.00" />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex sm:justify-end">
                      <button onClick={() => removeItem(index)} type="button"
                        className="w-full sm:w-auto px-3 py-2.5 rounded-xl text-xs font-semibold border border-red-400/25 bg-red-500/8 text-red-300 hover:bg-red-500/20 transition-colors">
                        âœ•
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* SECTION 7: TOTALS SUMMARY */}
            {items.length > 0 && (
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between border-b border-white/10"
                  style={{background:'rgba(255,255,255,0.05)'}}>
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Summary</span>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-white/60 font-medium">Tax Rate (%)</label>
                    <input type="number" min="0" max="100" step="0.1" value={taxRate}
                      onChange={e => setTaxRate(parseFloat(e.target.value)||0)}
                      className="w-16 px-2 py-1 rounded-lg text-right text-xs font-mono logistics-input-control" />
                  </div>
                </div>
                <div className="divide-y divide-white/5">
                  {[
                    ['Subtotal', formatCurrencyAmount(currency, subtotal), false],
                    [`VAT (${taxRate}%)`, formatCurrencyAmount(currency, tax), false],
                    ['Paid', formatCurrencyAmount(currency, paid), false],
                    ['Balance', formatCurrencyAmount(currency, total - paid), false],
                  ].map(([lbl, val, bold]) => (
                    <div key={String(lbl)} className="flex justify-between px-5 py-2.5">
                      <span className={`text-sm ${bold?'text-white font-bold':'text-white/60'}`}>{lbl}</span>
                      <span className={`text-sm font-mono ${bold?'text-white font-bold':'text-white/80'}`}>{String(val)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between px-5 py-3.5" style={{background:'rgba(124,58,237,0.15)'}}>
                    <span className="text-base font-black text-white">Grand Total</span>
                    <span className="text-base font-black text-[#A855F7] font-mono">{formatCurrencyAmount(currency, total)}</span>
                  </div>
                </div>
              </div>
            )}

          </>)}

          {/* â•â•â•â•â•â•â•â•â•â•â• WAYBILL MODE â•â•â•â•â•â•â•â•â•â•â• */}
          {type === 'WAYBILL' && (
            <div className="space-y-5">
              <SmartWaybillForm
                onGenerated={async (_pdfUrl, waybillData) => {
                  setIsWaybillSaving(true); setWaybillSaveError(null); setWaybillSaveSuccess(null)
                  try {
                    const doc = buildStoredWaybillFromFormData(waybillData)
                    await createWaybill(doc)
                    setWaybillSaveSuccess(`Waybill ${doc.waybillNumber} saved successfully.`)
                  } catch (err) {
                    console.error(err)
                    const msg = getWaybillErrorMessage(err, 'waybill save')
                    setWaybillSaveError(msg); throw new Error(msg)
                  } finally { setIsWaybillSaving(false) }
                }}
              />
              {isWaybillSaving && <p className="text-sm text-[#A855F7] flex items-center gap-2"><span className="animate-spin inline-block w-3 h-3 border-2 border-[#7C3AED] border-t-transparent rounded-full" />Saving waybillâ€¦</p>}
              {waybillSaveSuccess && <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{waybillSaveSuccess}</div>}
              {waybillSaveError && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{waybillSaveError}</div>}
              <AdminTimelineControlPanel />
            </div>
          )}

          {/* â”€â”€ GENERATE & PRINT ACTIONS â”€â”€ */}
          <div className="flex flex-col gap-3 pt-2">
            <button type="button" onClick={generate} disabled={items.length === 0 && type === 'RECEIPT'}
              className="admin-action-primary w-full py-4 rounded-2xl text-base font-black tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#7C3AED]/25 flex items-center justify-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Generate {type === 'RECEIPT' ? `${type} Â· ${receiptFormat.charAt(0).toUpperCase()+receiptFormat.slice(1)}` : type}
            </button>
            {type === 'RECEIPT' && (
              <button type="button" onClick={handlePrint}
                disabled={items.length === 0 && lastGeneratedDoc?.type !== 'RECEIPT'}
                className="admin-action-secondary w-full py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Print Receipt
              </button>
            )}
          </div>
        </div>

        {/* â”€â”€ RECENTLY GENERATED â”€â”€ */}
        {generated.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#A855F7]">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Recently Generated</h3>
            </div>
            <div className="grid gap-3">
              {generated.map((doc, i) => (
                <div key={i} className="rounded-2xl p-4 flex items-center justify-between gap-4"
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{background:'rgba(124,58,237,0.2)',border:'1px solid rgba(124,58,237,0.3)'}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2" className="w-4 h-4">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{doc.companyName}</p>
                      <p className="text-xs text-white/40 truncate">
                        {doc.type} Â· {doc.receiptFormat || 'classic'} Â· {doc.trackingNumber}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',color:'#A855F7'}}>
                      {doc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
