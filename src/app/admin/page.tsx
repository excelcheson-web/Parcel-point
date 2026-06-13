"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { CURRENCY_OPTIONS, formatCurrencyAmount, getCurrencyLabel } from "@/lib/currency";
import { getFirebaseAuth } from "@/lib/firebase";
import { signInWithCustomToken, signOut, onAuthStateChanged, getIdTokenResult } from "firebase/auth";

import { useState, useRef, useEffect, useCallback } from "react";

type ReceiptItem = { description: string; quantity: number; unitPrice?: number; total?: number }
type PaymentMethod = 'Cash' | 'Bank Transfer' | 'POS' | 'Credit Card'
type CurrencyCode = typeof CURRENCY_OPTIONS[number]
type ReceiptFormat = 'classic' | 'modern' | 'minimal' | 'executive'
type PaymentStatus = 'PAID' | 'PENDING' | 'PART_PAYMENT' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
type ReceiptTab = 'business' | 'customer' | 'receipt' | 'items' | 'signatory' | 'preview'

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['Cash', 'Bank Transfer', 'POS', 'Credit Card']
const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'PAID',         label: 'Paid',         color: '#10b981' },
  { value: 'PENDING',      label: 'Pending',      color: '#f59e0b' },
  { value: 'PART_PAYMENT', label: 'Part Paid',    color: '#3b82f6' },
  { value: 'FAILED',       label: 'Failed',       color: '#ef4444' },
  { value: 'REFUNDED',     label: 'Refunded',     color: '#8b5cf6' },
  { value: 'CANCELLED',    label: 'Cancelled',    color: '#6b7280' },
]

import type { DocumentConfig } from "@/lib/types";
import { SKYSHIP_CONFIG, generateTrackingId } from "@/lib/constants";

const LAST_RECEIPT_DOC_STORAGE_KEY = 'parcelpoint_last_receipt_doc'

const SmartWaybillForm = dynamic(() => import("@/components/SmartWaybillForm"), {
  loading: () => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/55">
      Loading waybill tools...
    </div>
  ),
})

const AdminTimelineControlPanel = dynamic(() => import("@/components/AdminTimelineControlPanel"), {
  loading: () => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/55">
      Loading timeline controls...
    </div>
  ),
})

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

// ── STATUS BADGE COLORS ────────────────────────────────────────────────────────
const STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  PAID:         { bg: '#10b981', text: '#fff' },
  PENDING:      { bg: '#f59e0b', text: '#fff' },
  PART_PAYMENT: { bg: '#3b82f6', text: '#fff' },
  FAILED:       { bg: '#ef4444', text: '#fff' },
  REFUNDED:     { bg: '#8b5cf6', text: '#fff' },
  CANCELLED:    { bg: '#6b7280', text: '#fff' },
}

// ── PREMIUM RECEIPT PRINT VIEW ─────────────────────────────────────────────────
interface ReceiptPrintViewProps {
  data: DocumentConfig
  pdfUrl?: string | null
  onBack: () => void
  previewMode?: boolean
}

function ReceiptPrintView({ data, pdfUrl, onBack, previewMode = false }: ReceiptPrintViewProps) {
  const companyName = asSafeText(data.companyName, 'Company Name')
  const companyAddress = asSafeText(data.companyAddress, 'Not provided')
  const companyPhone = asSafeText(data.companyPhone, 'Not provided')
  const companyEmail = asSafeText(data.companyEmail, 'Not provided')
  const companyCaption = asSafeText(data.companyCaption, '')
  const companyWebsite = asSafeText(data.companyWebsite, '')
  const customerName = asSafeText(data.customerName, 'Customer Name')
  const customerAddress = asSafeText(data.customerAddress, '')
  const customerPhone = asSafeText(data.customerPhone, '')
  const customerEmail = asSafeText(data.customerEmail, '')
  const receiptNumber = asSafeText(data.receiptNumber, data.trackingNumber || 'N/A')
  const issueDate = asSafeText(data.dateOfIssue, new Date().toISOString().split('T')[0])
  const paymentMethod = asSafeText(data.paymentMethod, 'Not provided')
  const transferMode = asSafeText(data.transferMode, 'Not provided')
  const notes = asSafeText(data.notes, 'Payment is due as agreed. Please include receipt number on all payments.')
  const terms = asSafeText(data.receiptTerms, '')
  const memo = asSafeText(data.receiptDescription || data.description, '')
  const signeeName = asSafeText(data.signeeName, 'Authorized Signatory')
  const footerMessage = asSafeText(data.footerMessage, '')
  const generatedBy = asSafeText(data.generatedBy, '')
  const paymentDate = asSafeText(data.paymentDate, '')
  const transactionRef = asSafeText(data.transactionReference, '')
  const orderNumber = asSafeText(data.orderNumber, '')
  const invoiceNumber = asSafeText(data.invoiceNumber, '')
  const taxRate = typeof data.taxRate === 'number' ? data.taxRate : 0
  const paid = typeof data.paid === 'number' ? data.paid : 0
  const items = Array.isArray(data.items) ? data.items : []
  const primaryColor = data.primaryColor || '#7C3AED'
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
  const fmtLabel = { classic: 'Premium Corporate', modern: 'Modern Brand', minimal: 'Luxury Minimal', executive: 'Compact POS' }[fmt]
  const paymentStatus = data.paymentStatus
  const statusColors = paymentStatus ? STATUS_COLORS[paymentStatus] : null

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
    alert('Printing is not available in this browser.')
  }, [pdfUrl])

  return (
    <div className={`receipt-print-shell ${previewMode ? '' : 'min-h-screen'} bg-[#eef2f7] px-3 py-4`}>
      {!previewMode && (
        <style jsx global>{`
          @media print {
            .receipt-print-shell { background: #fff !important; padding: 0 !important; }
            .receipt-print-actions { display: none !important; }
            .receipt-print-card { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; max-width: none !important; }
          }
        `}</style>
      )}

      <article className="receipt-print-card mx-auto w-full max-w-[460px] overflow-hidden rounded-xl border border-[#d7deea] bg-white shadow-sm">
        {/* Header band with dynamic primary color */}
        <div className="border-b border-[#d7deea] bg-white px-5 py-4 flex items-center justify-between"
          style={{ borderTopWidth: 4, borderTopStyle: 'solid', borderTopColor: primaryColor }}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {data.logoUrl && (
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-[#d7deea] shrink-0">
                <Image src={data.logoUrl} alt="Logo" fill className="object-contain p-1" sizes="40px" unoptimized />
              </div>
            )}
            <div className="min-w-0">
              <p className="break-words text-[#071427] font-bold text-sm leading-tight">{companyName}</p>
              {companyCaption && <p className="break-words text-xs italic leading-tight" style={{color: primaryColor}}>{companyCaption}</p>}
              <p className="break-words text-[#66758a] text-[10px] leading-tight">{companyPhone}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-black text-lg leading-none tracking-wide" style={{color: primaryColor}}>RECEIPT</p>
            <p className="text-[#66758a] text-[10px] mt-0.5">{fmtLabel} Format</p>
            {paymentStatus && statusColors && (
              <span className="mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: statusColors.bg, color: statusColors.text }}>
                {PAYMENT_STATUS_OPTIONS.find(s => s.value === paymentStatus)?.label}
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Receipt meta grid */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              ['Receipt No.', receiptNumber],
              ['Issue Date', issueDate],
              ...(paymentDate ? [['Payment Date', paymentDate]] : []),
              ...(invoiceNumber ? [['Invoice No.', invoiceNumber]] : []),
              ...(orderNumber ? [['Order No.', orderNumber]] : []),
              ...(transactionRef ? [['Ref.', transactionRef]] : []),
              ['Method', paymentMethod],
              ['Transfer', transferMode],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#e3e8f0] bg-white p-2">
                <p className="text-[9px] uppercase tracking-wider text-[#5a7090] font-semibold mb-0.5">{label}</p>
                <p className="text-xs font-bold text-[#0d2340] leading-tight break-all">{value}</p>
              </div>
            ))}
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="border border-[#d4deee] rounded-lg p-3">
              <p className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{color: primaryColor}}>From</p>
              <p className="break-words text-xs font-bold text-[#0d2340]">{companyName}</p>
              {companyCaption && <p className="break-words text-[10px] italic text-[#506680] mt-0.5">{companyCaption}</p>}
              <p className="break-words text-[10px] text-[#506680] mt-0.5 leading-snug">{companyAddress}</p>
              <p className="break-all text-[10px] text-[#506680] mt-0.5">{companyEmail}</p>
              {companyWebsite && <p className="break-all text-[10px] mt-0.5" style={{color: primaryColor}}>{companyWebsite}</p>}
            </div>
            <div className="border border-[#d4deee] rounded-lg p-3">
              <p className="text-[9px] uppercase tracking-wider font-bold mb-1" style={{color: primaryColor}}>Bill To</p>
              <p className="break-words text-xs font-bold text-[#0d2340]">{customerName}</p>
              {customerAddress && <p className="break-words text-[10px] text-[#506680] mt-0.5 leading-snug">{customerAddress}</p>}
              {customerPhone && <p className="break-words text-[10px] text-[#506680] mt-0.5">{customerPhone}</p>}
              {customerEmail && <p className="break-all text-[10px] text-[#506680] mt-0.5">{customerEmail}</p>}
            </div>
          </div>

          {/* Items table */}
          <div className="overflow-x-auto rounded-lg border border-[#d4deee]">
            <table className="w-full table-fixed text-xs">
              <thead>
                <tr className="text-[#071427]" style={{ backgroundColor: `${primaryColor}18` }}>
                  <th className="w-[46%] px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider">Description</th>
                  <th className="w-[12%] px-2 py-2 text-center text-[10px] font-bold uppercase">Qty</th>
                  <th className="w-[21%] px-2 py-2 text-right text-[10px] font-bold uppercase">Unit</th>
                  <th className="w-[21%] px-2 py-2 text-right text-[10px] font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? rows.map((row, i) => (
                  <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f7f9fd]'}>
                    <td className="border-b border-[#edf0f5] px-2 py-1.5 text-[#1a3550] font-medium break-words">{row.description}</td>
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
              [`Subtotal`, formatPrintCurrency(data.currency, subtotal)],
              [`VAT (${taxRate}%)`, formatPrintCurrency(data.currency, tax)],
              ['Paid', formatPrintCurrency(data.currency, paid)],
              ['Balance', formatPrintCurrency(data.currency, balance)],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex justify-between px-3 py-1.5 border-b border-[#edf0f5]">
                <span className="text-xs text-[#506680]">{label}</span>
                <span className="text-xs text-[#1a3550]">{String(value)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t-2 px-3 py-2.5" style={{ borderTopColor: primaryColor, backgroundColor: `${primaryColor}12` }}>
              <span className="text-sm font-bold text-[#071427]">Grand Total</span>
              <span className="text-sm font-black" style={{ color: primaryColor }}>{formatPrintCurrency(data.currency, grandTotal)}</span>
            </div>
          </div>

          {/* Notes + terms + memo */}
          <div className="rounded-lg border border-[#e3e8f0] bg-white p-3 space-y-2">
            {notes && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#5a7090] font-semibold mb-0.5">Notes</p>
                <p className="break-words text-xs text-[#506680] leading-relaxed">{notes}</p>
              </div>
            )}
            {terms && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#5a7090] font-semibold mb-0.5">Terms</p>
                <p className="break-words text-xs text-[#506680] leading-relaxed">{terms}</p>
              </div>
            )}
            {memo && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[#5a7090] font-semibold mb-0.5">Memo</p>
                <p className="break-words text-xs text-[#506680] leading-relaxed">{memo}</p>
              </div>
            )}
          </div>

          {/* Signatory */}
          <div className="border-t border-dashed border-[#b8cade] pt-3 flex items-end justify-between">
            <div className="min-w-0 pr-2">
              {data.signatureUrl && (
                <div className="relative h-8 w-28 mb-1">
                  <Image src={data.signatureUrl} alt="Signature" fill className="object-contain object-left" sizes="112px" unoptimized />
                </div>
              )}
              <div className="w-32 border-b mb-1" style={{ borderBottomColor: primaryColor }} />
              <p className="break-words text-xs font-bold text-[#1a3550]">{signeeName}</p>
              <p className="text-[10px] text-[#80a0c0]">Authorized Signatory</p>
              {generatedBy && <p className="break-words text-[9px] text-[#80a0c0] mt-0.5">Generated by: {generatedBy}</p>}
            </div>
            {data.stampUrl && (
              <div className="relative w-14 h-14">
                <Image src={data.stampUrl} alt="Stamp" fill className="object-contain" sizes="56px" unoptimized />
              </div>
            )}
          </div>
        </div>

        {/* Footer band */}
        <div className="border-t border-[#d4deee] px-5 py-2.5" style={{ backgroundColor: `${primaryColor}0a` }}>
          <p className="break-words text-[9px] text-[#80a0c0] text-center italic">
            {footerMessage || 'Computer-generated document.'}
          </p>
        </div>
      </article>

      {/* Actions — hidden in preview mode */}
      {!previewMode && (
        <>
          <div className="receipt-print-actions mx-auto mt-4 flex w-full max-w-[460px] flex-col gap-2 sm:flex-row">
            <button type="button" onClick={handlePrintTap}
              className="flex-1 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-colors"
              style={{ backgroundColor: primaryColor }}>
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
              &lt; Back
            </button>
          </div>
          <p className="mx-auto mt-2 w-full max-w-[460px] text-xs text-[#5a7090]">
            iPhone/Safari: if dialog does not show, tap <strong>Print Receipt</strong> again.
          </p>
        </>
      )}
    </div>
  )
}

// ── SECTION CARD ───────────────────────────────────────────────────────────────
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

// ── TAB BUTTON ─────────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
        active
          ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/25'
          : 'text-white/50 hover:text-white/80 hover:bg-white/5'
      }`}>
      {children}
    </button>
  )
}

// ── ADMIN PAGE ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const completeLogin = useCallback(async (token: string) => {
    await signInWithCustomToken(getFirebaseAuth(), token)
    setLoginError('')
    setLoginPassword('')
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (user) {
        try {
          const result = await getIdTokenResult(user)
          setIsAuthenticated(result.claims.admin === true)
        } catch { setIsAuthenticated(false) }
      } else { setIsAuthenticated(false) }
      setIsAuthReady(true)
    })
    return () => unsubscribe()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const u = loginUsername.trim(), p = loginPassword
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      })
      if (!res.ok) { setLoginError('Invalid username or password'); return }
      const { token } = await res.json()
      await completeLogin(token)
    } catch { setLoginError('Unable to login right now. Please try again.') }
  }

  const handleLogout = async () => {
    try { await signOut(getFirebaseAuth()) } catch {}
    setIsAuthenticated(false); setLoginUsername(''); setLoginPassword(''); setLoginError('')
  }

  // ── DOCUMENT TYPE ──
  const [type, setType] = useState<'RECEIPT' | 'WAYBILL'>('RECEIPT')
  const [receiptTab, setReceiptTab] = useState<ReceiptTab>('business')

  // ── BRANDING ──
  const [receiptFormat, setReceiptFormat] = useState<ReceiptFormat>('classic')
  const [companyName, setCompanyName] = useState('')
  const [companyCaption, setCompanyCaption] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#7C3AED')
  const [secondaryColor, setSecondaryColor] = useState('#071427')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── COMPANY CONTACT ──
  const [companyAddress, setCompanyAddress] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')

  // ── CUSTOMER ──
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  // ── RECEIPT DETAILS ──
  const [receiptNumber, setReceiptNumber] = useState('')
  const [dateOfIssue, setDateOfIssue] = useState(() => new Date().toISOString().split('T')[0])
  const [paymentDate, setPaymentDate] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [transactionReference, setTransactionReference] = useState('')
  const [receiptDescription, setReceiptDescription] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PAID')

  // ── PAYMENT ──
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [taxRate, setTaxRate] = useState(0)
  const [paid, setPaid] = useState(0)
  const [balance, setBalance] = useState(0)

  // ── ITEMS ──
  const [items, setItems] = useState<ReceiptItem[]>([])

  // ── SIGNATORY / EXTRAS ──
  const [signeeName, setSigneeName] = useState('')
  const [generatedBy, setGeneratedBy] = useState('')
  const [signatureUrl, setSignatureUrl] = useState('')
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [stampUrl, setStampUrl] = useState('')
  const [stampPreview, setStampPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [receiptTerms, setReceiptTerms] = useState('')
  const [footerMessage, setFooterMessage] = useState('')
  const signatureInputRef = useRef<HTMLInputElement>(null)
  const stampInputRef = useRef<HTMLInputElement>(null)

  // ── PDF / PRINT STATE ──
  const [generated, setGenerated] = useState<DocumentConfig[]>([])
  const [isWaybillSaving, setIsWaybillSaving] = useState(false)
  const [waybillSaveError, setWaybillSaveError] = useState<string | null>(null)
  const [waybillSaveSuccess, setWaybillSaveSuccess] = useState<string | null>(null)
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string | null>(null)
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState<DocumentConfig | null>(null)
  const [printViewDoc, setPrintViewDoc] = useState<DocumentConfig | null>(null)

  // ── PERSIST LAST RECEIPT ──
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

  // ── ITEM MANAGEMENT ──
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

  // ── FILE UPLOADS ──
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
    if (newType !== 'RECEIPT') {
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
      companyCaption: asOptionalText(companyCaption),
      companyWebsite: asOptionalText(companyWebsite),
      logoUrl: asOptionalText(logoUrl),
      primaryColor: primaryColor || '#7C3AED',
      secondaryColor: secondaryColor || '#071427',
      type: 'RECEIPT',
      items: normalizedItems,
      origin: '',
      destination: '',
      trackingNumber: safeTracking,
      status: 'PENDING',
      receiptNumber: autoRcpNum,
      dateOfIssue: asSafeText(dateOfIssue, new Date().toISOString().split('T')[0]),
      paymentDate: asOptionalText(paymentDate),
      invoiceNumber: asOptionalText(invoiceNumber),
      orderNumber: asOptionalText(orderNumber),
      transactionReference: asOptionalText(transactionReference),
      paymentMethod, currency,
      paymentStatus: paymentStatus || undefined,
      companyAddress: asOptionalText(companyAddress),
      companyPhone: asOptionalText(companyPhone),
      companyEmail: asOptionalText(companyEmail),
      customerName: asOptionalText(customerName),
      customerPhone: asOptionalText(customerPhone),
      customerEmail: asOptionalText(customerEmail),
      customerAddress: asOptionalText(customerAddress),
      taxRate: Number(taxRate)||0,
      paid: Number(paid)||0,
      balance: Number(balance)||0,
      notes: asOptionalText(notes),
      receiptTerms: asOptionalText(receiptTerms),
      footerMessage: asOptionalText(footerMessage),
      generatedBy: asOptionalText(generatedBy),
      description: asOptionalText(receiptDescription),
      receiptDescription: asOptionalText(receiptDescription),
      signeeName: asSafeText(signeeName, 'Authorized Signatory'),
      signatureUrl: asOptionalText(signatureUrl),
      stampUrl: asOptionalText(stampUrl),
      receiptFormat,
      transferMode: paymentMethod,
    }
  }, [
    balance, companyAddress, companyCaption, companyEmail, companyName, companyPhone, companyWebsite,
    currency, customerAddress, customerEmail, customerName, customerPhone, dateOfIssue, footerMessage,
    generatedBy, invoiceNumber, items, logoUrl, makeReceiptNumber, notes, orderNumber, paid,
    paymentDate, paymentMethod, paymentStatus, primaryColor, receiptDescription, receiptFormat,
    receiptNumber, receiptTerms, secondaryColor, signeeName, signatureUrl, stampUrl, taxRate,
    transactionReference,
  ])

  const generate = async () => {
    try {
      const trackingNumber = generateTrackingId()
      const doc: DocumentConfig = buildReceiptDocument(trackingNumber)
      setLastGeneratedDoc(doc)
      setGenerated(prev => [doc, ...prev.slice(0,4)])
      try {
        const { default: generateDocumentPDF } = await import("@/components/DocumentTemplate")
        const pdfUrl = await generateDocumentPDF(doc)
        setLastGeneratedUrl(pdfUrl)
        if (!isMobileBrowser()) {
          const link = document.createElement('a')
          link.href = pdfUrl; link.download = `receipt_${trackingNumber}.pdf`
          document.body.appendChild(link); link.click(); document.body.removeChild(link)
        }
        alert('Receipt generated successfully!')
      } catch (pdfError) {
        console.error('PDF generation warning:', pdfError)
        setLastGeneratedUrl(null)
        alert('Receipt prepared for printing. PDF copy unavailable on this device/browser.')
      }
    } catch (error) {
      alert(`Error generating Receipt: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

  // Live preview document (built from current form state without committing)
  const livePreviewDoc = useCallback((): DocumentConfig => buildReceiptDocument(), [buildReceiptDocument])

  // ── RENDER GUARDS ──
  if (!isAuthReady) {
    return (
      <div className="admin-polish min-h-screen flex items-center justify-center">
        <div className="admin-muted text-sm">Loading admin access…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-polish min-h-screen flex items-center justify-center px-4 py-10">
        <div className="admin-login-card w-full max-w-[420px] p-8 sm:p-10">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-[#7C3AED]/40 shadow-lg shadow-[#7C3AED]/20">
              <Image src="/parcel-point-logo.png" alt="Parcel Point" fill className="object-contain" sizes="64px" priority />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
              <p className="text-white/50 text-sm mt-0.5">Parcel Point — Secure Access</p>
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
            <button type="submit" className="admin-action-primary w-full rounded-xl py-3.5 font-bold transition mt-2">Sign In</button>
          </form>
          <div className="mt-8 flex items-center justify-center gap-2 text-white/25 text-xs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>256-bit SSL — Secured by Parcel Point</span>
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

  // ── FORMAT CARDS ──
  const formatOptions = [
    { id: 'classic',   label: 'Premium Corporate', icon: '🏢', sub: 'Header band, party blocks, dark table' },
    { id: 'modern',    label: 'Modern Brand',       icon: '🎨', sub: 'Bold brand header, open layout' },
    { id: 'minimal',   label: 'Luxury Minimal',     icon: '💎', sub: 'Elegant spacing, fine typography' },
    { id: 'executive', label: 'Compact POS',         icon: '🧾', sub: 'Narrow thermal strip, QR + barcode' },
  ] as const

  // ── MAIN DASHBOARD ──
  return (
    <div className="admin-polish flex min-h-full flex-col items-center py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl space-y-6">

        {/* HEADER */}
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

        {/* MAIN CARD */}
        <div className="admin-main-card p-5 sm:p-7 lg:p-8 space-y-6">

          {/* MODE TABS */}
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

          {/* ══════════ RECEIPT MODE ══════════ */}
          {type === 'RECEIPT' && (<>

            {/* RECEIPT SECTION TABS */}
            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)'}}>
              {([
                { id: 'business',   label: 'Business',   icon: '🏢' },
                { id: 'customer',   label: 'Customer',   icon: '👤' },
                { id: 'receipt',    label: 'Receipt',    icon: '🧾' },
                { id: 'items',      label: 'Items',      icon: '📋' },
                { id: 'signatory',  label: 'Signatory',  icon: '✍️' },
                { id: 'preview',    label: 'Preview',    icon: '👁' },
              ] as const).map(tab => (
                <TabBtn key={tab.id} active={receiptTab === tab.id} onClick={() => setReceiptTab(tab.id)}>
                  <span>{tab.icon}</span>
                  {tab.label}
                  {tab.id === 'items' && items.length > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${receiptTab === 'items' ? 'bg-white/20' : 'bg-[#7C3AED]/40'}`}>
                      {items.length}
                    </span>
                  )}
                </TabBtn>
              ))}
            </div>

            {/* ── TAB: BUSINESS ── */}
            {receiptTab === 'business' && (
              <div className="space-y-5">
                <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>} label="Company Identity">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Logo upload */}
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-[#3a587f] bg-[#0d2540] flex items-center justify-center"
                        style={logoPreview ? {borderStyle:'solid',borderColor:'rgba(124,58,237,0.5)'} : {}}>
                        {logoPreview ? (
                          <Image src={logoPreview} alt="Logo" fill className="object-contain p-2" sizes="80px" unoptimized />
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
                      <p className="text-[10px] text-white/30 text-center leading-tight">PNG/JPG, max 5MB</p>
                    </div>

                    {/* Company fields */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className={labelCls}>Business Name</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                          className={inputCls} placeholder="e.g. Apex Holdings Ltd." />
                      </div>
                      <div>
                        <label className={labelCls}>Caption / Slogan</label>
                        <input type="text" value={companyCaption} onChange={e => setCompanyCaption(e.target.value)}
                          className={inputCls} placeholder="e.g. Building the Future, Together" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Website</label>
                          <input type="url" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)}
                            className={inputCls} placeholder="https://company.com" />
                        </div>
                        <div>
                          <label className={labelCls}>Email</label>
                          <input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)}
                            className={inputCls} placeholder="hello@company.com" />
                        </div>
                        <div>
                          <label className={labelCls}>Phone</label>
                          <input type="tel" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)}
                            className={inputCls} placeholder="+63 956 988 3401" />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Address</label>
                        <textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)}
                          rows={2} className={inputCls + ' resize-none'} placeholder="Full business address" />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>} label="Brand Colors & Template">
                  {/* Format picker */}
                  <div>
                    <label className={labelCls}>Receipt Template</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                      {formatOptions.map(f => (
                        <button key={f.id} type="button" onClick={() => setReceiptFormat(f.id)}
                          className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all ${
                            receiptFormat === f.id
                              ? 'border-[#7C3AED] bg-[#7C3AED]/15 shadow-inner'
                              : 'border-white/10 bg-white/3 hover:border-white/20'
                          }`}>
                          <span className="text-base mb-0.5">{f.icon}</span>
                          <span className={`text-xs font-bold leading-tight ${receiptFormat===f.id?'text-[#A855F7]':'text-white/70'}`}>{f.label}</span>
                          <span className="text-[9px] text-white/35 leading-tight">{f.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color pickers */}
                  <div className="grid grid-cols-2 gap-4 mt-1">
                    <div>
                      <label className={labelCls}>Primary Brand Color</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent p-0.5" />
                        <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                          className="flex-1 logistics-input-control px-3 py-2 text-sm font-mono" placeholder="#7C3AED" maxLength={7} />
                      </div>
                      <p className="text-[10px] text-white/30 mt-1">Used for accents, titles, headers</p>
                    </div>
                    <div>
                      <label className={labelCls}>Secondary Brand Color</label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent p-0.5" />
                        <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
                          className="flex-1 logistics-input-control px-3 py-2 text-sm font-mono" placeholder="#071427" maxLength={7} />
                      </div>
                      <p className="text-[10px] text-white/30 mt-1">Used for dark sections, text</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-white/25 -mt-2">Colors auto-apply to all receipt templates. Leave as default for logo-derived colors.</p>
                </SectionCard>
              </div>
            )}

            {/* ── TAB: CUSTOMER ── */}
            {receiptTab === 'customer' && (
              <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} label="Customer Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Customer / Company Name</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                      className={inputCls} placeholder="Full name or company" />
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                      className={inputCls} placeholder="+63 956 988 3401" />
                  </div>
                  <div>
                    <label className={labelCls}>Email Address</label>
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                      className={inputCls} placeholder="customer@example.com" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Billing Address</label>
                    <textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                      rows={3} className={inputCls + ' resize-none'} placeholder="Full billing address" />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* ── TAB: RECEIPT ── */}
            {receiptTab === 'receipt' && (
              <div className="space-y-5">
                <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} label="Receipt Details">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Receipt Number</label>
                      <input type="text" value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)}
                        className={inputCls} placeholder="Auto-generated if blank" />
                    </div>
                    <div>
                      <label className={labelCls}>Issue Date</label>
                      <input type="date" value={dateOfIssue} onChange={e => setDateOfIssue(e.target.value)}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Payment Date</label>
                      <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Invoice Number</label>
                      <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                        className={inputCls} placeholder="INV-2026-001" />
                    </div>
                    <div>
                      <label className={labelCls}>Order Number</label>
                      <input type="text" value={orderNumber} onChange={e => setOrderNumber(e.target.value)}
                        className={inputCls} placeholder="ORD-001" />
                    </div>
                    <div>
                      <label className={labelCls}>Transaction Reference</label>
                      <input type="text" value={transactionReference} onChange={e => setTransactionReference(e.target.value)}
                        className={inputCls} placeholder="TXN-ABC123" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={labelCls}>Description / Memo</label>
                      <textarea value={receiptDescription} onChange={e => setReceiptDescription(e.target.value)}
                        rows={2} className={inputCls + ' resize-none'} placeholder="Receipt memo or description" />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>} label="Payment Information">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Payment Method</label>
                      <select value={paymentMethod}
                        onChange={e => { const v=e.target.value as PaymentMethod; if(PAYMENT_METHOD_OPTIONS.includes(v)) setPaymentMethod(v) }}
                        className={selectCls}>
                        {PAYMENT_METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Currency</label>
                      <select value={currency}
                        onChange={e => { const v=e.target.value as CurrencyCode; if(CURRENCY_OPTIONS.includes(v)) setCurrency(v) }}
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

                  {/* Payment status selector */}
                  <div>
                    <label className={labelCls}>Payment Status</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PAYMENT_STATUS_OPTIONS.map(s => (
                        <button key={s.value} type="button"
                          onClick={() => setPaymentStatus(s.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            paymentStatus === s.value ? 'shadow-md scale-105' : 'opacity-55 hover:opacity-80'
                          }`}
                          style={{
                            backgroundColor: paymentStatus === s.value ? s.color : 'transparent',
                            borderColor: s.color,
                            color: paymentStatus === s.value ? '#fff' : s.color,
                          }}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── TAB: ITEMS ── */}
            {receiptTab === 'items' && (
              <div className="space-y-5">
                <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>} label="Line Items">
                  <div className="flex justify-end mb-2">
                    <button type="button" onClick={addItem}
                      className="admin-action-secondary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Item
                    </button>
                  </div>

                  {items.length === 0 && (
                    <div className="text-center py-10 rounded-xl border border-dashed border-white/10">
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
                            x
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Totals summary */}
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
                        ['Subtotal', formatCurrencyAmount(currency, subtotal)],
                        [`VAT (${taxRate}%)`, formatCurrencyAmount(currency, tax)],
                        ['Paid', formatCurrencyAmount(currency, paid)],
                        ['Balance', formatCurrencyAmount(currency, total - paid)],
                      ].map(([lbl, val]) => (
                        <div key={String(lbl)} className="flex justify-between px-5 py-2.5">
                          <span className="text-sm text-white/60">{lbl}</span>
                          <span className="text-sm font-mono text-white/80">{String(val)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between px-5 py-3.5" style={{background:'rgba(124,58,237,0.15)'}}>
                        <span className="text-base font-black text-white">Grand Total</span>
                        <span className="text-base font-black text-[#A855F7] font-mono">{formatCurrencyAmount(currency, total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: SIGNATORY ── */}
            {receiptTab === 'signatory' && (
              <div className="space-y-5">
                <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>} label="Sign-off & Stamp">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Signee Name</label>
                      <input type="text" value={signeeName} onChange={e => setSigneeName(e.target.value)}
                        className={inputCls} placeholder="e.g. Parcel Point Desk" />
                    </div>
                    <div>
                      <label className={labelCls}>Generated By</label>
                      <input type="text" value={generatedBy} onChange={e => setGeneratedBy(e.target.value)}
                        className={inputCls} placeholder="e.g. Finance Department" />
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

                <SectionCard icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>} label="Notes, Terms & Footer">
                  <div className="space-y-4">
                    <div>
                      <label className={labelCls}>Notes</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)}
                        rows={3} className={inputCls + ' resize-none'}
                        placeholder="Payment is due as agreed. Please include receipt number on all payments." />
                    </div>
                    <div>
                      <label className={labelCls}>Terms &amp; Conditions</label>
                      <textarea value={receiptTerms} onChange={e => setReceiptTerms(e.target.value)}
                        rows={3} className={inputCls + ' resize-none'}
                        placeholder="All sales are final. No refunds after 30 days..." />
                    </div>
                    <div>
                      <label className={labelCls}>Footer Message</label>
                      <input type="text" value={footerMessage} onChange={e => setFooterMessage(e.target.value)}
                        className={inputCls} placeholder="Thank you for your business!" />
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── TAB: PREVIEW ── */}
            {receiptTab === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <p className="text-xs text-white/40 font-medium tracking-wider uppercase">Live Preview — updates as you edit</p>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div className="overflow-auto rounded-2xl border border-white/10 bg-white/3 p-4 max-h-[800px]">
                  <ReceiptPrintView
                    data={livePreviewDoc()}
                    onBack={() => setReceiptTab('items')}
                    previewMode={true}
                  />
                </div>
                <p className="text-[10px] text-white/25 text-center">This is an HTML preview. The PDF may differ slightly in typography.</p>
              </div>
            )}

            {/* GENERATE & PRINT ACTIONS */}
            <div className="flex flex-col gap-3 pt-2">
              <button type="button" onClick={generate} disabled={items.length === 0}
                className="admin-action-primary w-full py-4 rounded-2xl text-base font-black tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#7C3AED]/25 flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Generate Receipt — {formatOptions.find(f=>f.id===receiptFormat)?.label}
              </button>
              <button type="button" onClick={handlePrint}
                disabled={items.length === 0 && lastGeneratedDoc?.type !== 'RECEIPT'}
                className="admin-action-secondary w-full py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                Print Receipt
              </button>
              {receiptTab !== 'preview' && (
                <button type="button" onClick={() => setReceiptTab('preview')}
                  className="w-full py-2.5 rounded-2xl text-sm font-semibold text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70 transition-all flex items-center justify-center gap-2">
                  <span>👁</span> Preview Receipt
                </button>
              )}
            </div>

          </>)}

          {/* ══════════ WAYBILL MODE ══════════ */}
          {type === 'WAYBILL' && (
            <div className="space-y-5">
              <SmartWaybillForm
                onGenerated={async (_pdfUrl, waybillData) => {
                  setIsWaybillSaving(true); setWaybillSaveError(null); setWaybillSaveSuccess(null)
                  let getWaybillErrorMessage: ((error: unknown, context?: string) => string) | null = null
                  try {
                    const waybillService = await import("@/services/waybillService")
                    getWaybillErrorMessage = waybillService.getWaybillErrorMessage
                    const doc = waybillService.buildStoredWaybillFromFormData(waybillData)
                    await waybillService.createWaybill(doc)
                    setWaybillSaveSuccess(`Waybill ${doc.waybillNumber} saved successfully.`)
                  } catch (err) {
                    const msg = getWaybillErrorMessage
                      ? getWaybillErrorMessage(err, 'waybill save')
                      : err instanceof Error
                        ? err.message
                        : 'Unable to save waybill right now. Please try again.'
                    setWaybillSaveError(msg); throw new Error(msg)
                  } finally { setIsWaybillSaving(false) }
                }}
              />
              {isWaybillSaving && <p className="text-sm text-[#A855F7] flex items-center gap-2"><span className="animate-spin inline-block w-3 h-3 border-2 border-[#7C3AED] border-t-transparent rounded-full" />Saving waybill…</p>}
              {waybillSaveSuccess && <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{waybillSaveSuccess}</div>}
              {waybillSaveError && <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{waybillSaveError}</div>}
              <AdminTimelineControlPanel />
            </div>
          )}

        </div>

        {/* RECENTLY GENERATED */}
        {generated.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#A855F7]">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Recently Generated</h3>
            </div>
            <div className="grid gap-3">
              {generated.map((doc, i) => {
                const fmt = doc.receiptFormat || 'classic'
                const fmtLabel = { classic: 'Premium Corporate', modern: 'Modern Brand', minimal: 'Luxury Minimal', executive: 'Compact POS' }[fmt] || fmt
                const status = doc.paymentStatus
                const sc = status ? STATUS_COLORS[status as PaymentStatus] : null
                return (
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
                          {fmtLabel} — {doc.trackingNumber}
                          {doc.customerName ? ` — ${doc.customerName}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {sc && status && (
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                          style={{background: sc.bg, color: sc.text}}>
                          {PAYMENT_STATUS_OPTIONS.find(s=>s.value===status)?.label}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
