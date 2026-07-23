// src/services/waybillService.ts
import { db, firebaseConfigState } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  DocumentReference,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import type { StoredWaybill, TrackingEventRecord, WaybillFormData } from '@/lib/types';
import { applyRuntimeToWaybill, normalizeTrackingEvents } from '@/lib/trackingAutomation';

export type TrackingEvent = TrackingEventRecord;
export type Waybill = StoredWaybill;

const WAYBILLS_COLLECTION = 'waybills';
const FIREBASE_READ_TIMEOUT_MS = 15000;
const FIREBASE_WRITE_TIMEOUT_MS = 20000;
const FIREBASE_READ_RETRIES = 2;
const FIREBASE_WRITE_RETRIES = 1;
const MAX_TRACKING_EVENTS_PER_WAYBILL = 250;
const LEGACY_TIMELINE_ALIGNMENT_VERSION = 1;
const LEGACY_TIMELINE_ALIGNMENT_MARKER_FIELD = 'timelineAlignmentMarker';
const LEGACY_TIMELINE_ALIGNMENT_VERSION_FIELD = 'timelineAlignmentVersion';

export type WaybillServiceErrorKind =
  | 'network'
  | 'permission'
  | 'config'
  | 'timeout'
  | 'unavailable'
  | 'not_found'
  | 'invalid_input'
  | 'unexpected';

type WaybillErrorCode = string | undefined;

type WaybillErrorLogPayload = {
  operation: string;
  kind: WaybillServiceErrorKind;
  code?: string;
  message: string;
  retryable: boolean;
  attempt?: number;
};

export class WaybillServiceError extends Error {
  kind: WaybillServiceErrorKind;
  code?: string;
  operation: string;
  retryable: boolean;
  cause?: unknown;

  constructor({
    message,
    kind,
    code,
    operation,
    retryable,
    cause,
  }: {
    message: string;
    kind: WaybillServiceErrorKind;
    code?: string;
    operation: string;
    retryable: boolean;
    cause?: unknown;
  }) {
    super(message);
    this.name = 'WaybillServiceError';
    this.kind = kind;
    this.code = code;
    this.operation = operation;
    this.retryable = retryable;
    this.cause = cause;
  }
}

class OperationTimeoutError extends Error {
  code: string;
  operation: string;
  timeoutMs: number;

  constructor(operation: string, timeoutMs: number) {
    super(`Operation "${operation}" timed out after ${timeoutMs}ms`);
    this.name = 'OperationTimeoutError';
    this.code = 'app/timeout';
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

export function normalizeWaybillLookupInput(input: string): string {
  return input.trim().replace(/\s+/g, '').toUpperCase();
}

export function isWaybillServiceError(error: unknown): error is WaybillServiceError {
  return error instanceof WaybillServiceError;
}

export function getWaybillErrorMessage(error: unknown, context = 'request'): string {
  if (!isWaybillServiceError(error)) {
    return `Unexpected ${context} failure. Please try again.`;
  }

  if (error.kind === 'invalid_input') {
    return 'Please enter a valid waybill/tracking number.';
  }
  if (error.kind === 'timeout') {
    return `The ${context} timed out. Please retry.`;
  }
  if (error.kind === 'network' || error.kind === 'unavailable') {
    return `Network issue while processing the ${context}. Check connection and retry.`;
  }
  if (error.kind === 'permission' || error.kind === 'config') {
    return `Access/configuration issue while processing the ${context}. Please contact support.`;
  }
  if (error.kind === 'not_found') {
    return 'Waybill not found.';
  }

  return `Unable to complete the ${context} right now. Please try again.`;
}

function reportWaybillFailure(payload: WaybillErrorLogPayload): void {
  console.error('[firebase-waybill-error]', payload);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:firebase-error', { detail: payload }));
    const maybeReporter = (window as unknown as { __reportFirebaseError?: (event: WaybillErrorLogPayload) => void }).__reportFirebaseError;
    if (typeof maybeReporter === 'function') {
      maybeReporter(payload);
    }
  }
}

function extractErrorCode(error: unknown): WaybillErrorCode {
  if (!error || typeof error !== 'object') return undefined;
  const raw = (error as { code?: unknown }).code;
  return typeof raw === 'string' ? raw : undefined;
}

function ensureFirebaseConfigured(operation: string): void {
  if (firebaseConfigState.isConfigured) return;

  throw new WaybillServiceError({
    message: `Firebase is not configured. Missing keys: ${firebaseConfigState.missingKeys.join(', ')}`,
    kind: 'config',
    code: 'app/config-missing',
    operation,
    retryable: false,
  });
}

function toWaybillServiceError(operation: string, error: unknown): WaybillServiceError {
  if (error instanceof WaybillServiceError) return error;
  if (error instanceof OperationTimeoutError) {
    return new WaybillServiceError({
      message: error.message,
      kind: 'timeout',
      code: error.code,
      operation,
      retryable: true,
      cause: error,
    });
  }

  const code = extractErrorCode(error);
  const normalizedCode = code?.toLowerCase() ?? '';
  const message = error instanceof Error ? error.message : 'Unknown Firebase failure';
  const loweredMessage = message.toLowerCase();

  if (
    normalizedCode.includes('permission-denied') ||
    normalizedCode.includes('unauthenticated') ||
    normalizedCode.includes('failed-precondition')
  ) {
    return new WaybillServiceError({
      message,
      kind: 'permission',
      code,
      operation,
      retryable: false,
      cause: error,
    });
  }

  if (normalizedCode.includes('not-found')) {
    return new WaybillServiceError({
      message,
      kind: 'not_found',
      code,
      operation,
      retryable: false,
      cause: error,
    });
  }

  if (
    normalizedCode.includes('deadline-exceeded') ||
    normalizedCode.includes('timeout') ||
    loweredMessage.includes('timed out')
  ) {
    return new WaybillServiceError({
      message,
      kind: 'timeout',
      code,
      operation,
      retryable: true,
      cause: error,
    });
  }

  if (
    normalizedCode.includes('unavailable') ||
    normalizedCode.includes('resource-exhausted')
  ) {
    return new WaybillServiceError({
      message,
      kind: 'unavailable',
      code,
      operation,
      retryable: true,
      cause: error,
    });
  }

  if (
    normalizedCode.includes('network-request-failed') ||
    loweredMessage.includes('network') ||
    loweredMessage.includes('failed to fetch')
  ) {
    return new WaybillServiceError({
      message,
      kind: 'network',
      code,
      operation,
      retryable: true,
      cause: error,
    });
  }

  return new WaybillServiceError({
    message,
    kind: 'unexpected',
    code,
    operation,
    retryable: false,
    cause: error,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(operation: string, task: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new OperationTimeoutError(operation, timeoutMs)), timeoutMs);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

async function runFirestoreOperation<T>(
  operation: string,
  runner: () => Promise<T>,
  options?: { timeoutMs?: number; retries?: number; silentKinds?: WaybillServiceErrorKind[] }
): Promise<T> {
  ensureFirebaseConfigured(operation);

  const timeoutMs = options?.timeoutMs ?? FIREBASE_READ_TIMEOUT_MS;
  const retries = options?.retries ?? 0;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await withTimeout(operation, runner(), timeoutMs);
    } catch (rawError) {
      const serviceError = toWaybillServiceError(operation, rawError);

      if (!options?.silentKinds?.includes(serviceError.kind)) {
        reportWaybillFailure({
          operation,
          kind: serviceError.kind,
          code: serviceError.code,
          message: serviceError.message,
          retryable: serviceError.retryable,
          attempt: attempt + 1,
        });
      }

      const canRetry = serviceError.retryable && attempt < retries;
      if (!canRetry) {
        throw serviceError;
      }

      const backoffMs = 350 * (attempt + 1);
      await delay(backoffMs);
      attempt += 1;
    }
  }

  throw new WaybillServiceError({
    message: `Operation "${operation}" failed after retries.`,
    kind: 'unexpected',
    operation,
    retryable: false,
  });
}

const ALWAYS_DROP_FIELDS = new Set([
  'logoPreview',
  'signaturePreview',
  'pdfUrl',
  'pdfBlob',
  'pdfBase64',
  'fileData',
]);

const CONDITIONAL_HEAVY_FIELDS = new Set([
  'logoUrl',
  'signatureUrl',
  'senderLogoUrl',
]);

function isHeavyString(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.startsWith('data:')) return true;
  if (trimmed.startsWith('blob:')) return true;
  if (trimmed.length > 100000) return true;
  return false;
}

function sanitizeForFirestoreWrite<T>(input: T): T {
  function sanitizeValue(value: unknown, key?: string): unknown {
    if (value === undefined) return undefined;

    if (typeof value === 'string') {
      if (key && ALWAYS_DROP_FIELDS.has(key)) return undefined;
      if (key && CONDITIONAL_HEAVY_FIELDS.has(key) && isHeavyString(value)) return undefined;
      if (isHeavyString(value) && value.length > 1000000) return undefined;
      return value;
    }

    if (Array.isArray(value)) {
      const sanitizedArray = value
        .map((item) => sanitizeValue(item))
        .filter((item) => item !== undefined);
      return sanitizedArray;
    }

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const sanitizedObj: Record<string, unknown> = {};

      Object.entries(obj).forEach(([k, v]) => {
        if (ALWAYS_DROP_FIELDS.has(k)) return;
        const sanitized = sanitizeValue(v, k);
        if (sanitized !== undefined) {
          sanitizedObj[k] = sanitized;
        }
      });

      return sanitizedObj;
    }

    return value;
  }

  return sanitizeValue(input) as T;
}

function dedupeAndSortEvents(events: TrackingEvent[]): TrackingEvent[] {
  const map = new Map<string, TrackingEvent>();
  events.forEach((event) => {
    const key = `${event.status}|${event.location}|${event.description}|${event.eventTime}|${event.isHold ? '1' : '0'}`;
    if (!map.has(key)) {
      map.set(key, event);
    }
  });
  const normalized = normalizeTrackingEvents(Array.from(map.values()));
  if (normalized.length <= MAX_TRACKING_EVENTS_PER_WAYBILL) {
    return normalized;
  }

  return normalized.slice(-MAX_TRACKING_EVENTS_PER_WAYBILL);
}

function shiftEventsAfterHoldRelease(
  previousEvents: TrackingEvent[],
  nextEvents: TrackingEvent[],
  wasOnHold: boolean,
  resumeAtIso: string
): TrackingEvent[] {
  if (!wasOnHold) return nextEvents;

  const previousHoldIndex = previousEvents.findIndex((event) => event.isHold);
  if (previousHoldIndex < 0) return nextEvents;

  const nextHoldIndex = nextEvents.findIndex((event) => event.isHold);
  if (nextHoldIndex >= 0) return nextEvents;

  const anchorIndex = Math.min(previousHoldIndex, nextEvents.length - 1);
  if (anchorIndex < 0) return nextEvents;

  const anchorMs = Date.parse(nextEvents[anchorIndex]?.eventTime || '');
  const resumeMs = Date.parse(resumeAtIso);
  if (Number.isNaN(anchorMs) || Number.isNaN(resumeMs)) return nextEvents;

  const deltaMs = resumeMs - anchorMs;
  if (deltaMs <= 0) return nextEvents;

  return nextEvents.map((event, index) => {
    if (index < anchorIndex) return event;
    return {
      ...event,
      eventTime: new Date(Date.parse(event.eventTime) + deltaMs).toISOString(),
    };
  });
}

function applyLegacyTimelineDateAlignment(waybill: Waybill): {
  waybill: Waybill;
  corrected: boolean;
  markerValue?: string;
} {
  const markerVersion = (waybill as Record<string, unknown>)[LEGACY_TIMELINE_ALIGNMENT_VERSION_FIELD];
  if (markerVersion === LEGACY_TIMELINE_ALIGNMENT_VERSION) {
    return { waybill, corrected: false };
  }

  return { waybill, corrected: false };
}


export function createInitialTrackingEvents(origin: string): TrackingEvent[] {
  const now = new Date();
  const created = new Date(now.getTime() + 1000);
  return [
    {
      status: 'Shipment Received',
      location: origin || 'Origin Facility',
      description: 'Shipment has been received for processing.',
      eventTime: now.toISOString(),
      isHold: false,
    },
    {
      status: 'Shipment Created',
      location: origin || 'Origin Facility',
      description: 'Waybill has been created successfully.',
      eventTime: created.toISOString(),
      isHold: false,
    },
  ];
}

function normalizeServiceTypeLabel(waybillData: WaybillFormData): string {
  return (
    waybillData.serviceTypeString ||
    (waybillData.serviceType?.doorToDoor
      ? 'Door to Door'
      : waybillData.serviceType?.worldMail
      ? 'World Mail'
      : waybillData.serviceType?.domestic
      ? 'Domestic'
      : waybillData.serviceType?.diplomaticCourier
      ? 'Diplomatic Courier'
      : waybillData.serviceType?.repairReturn
      ? 'Repair Return'
      : 'Not provided')
  );
}

export function buildStoredWaybillFromFormData(waybillData: WaybillFormData): Waybill {
  const now = new Date().toISOString();
  const waybillNumber = normalizeWaybillLookupInput(waybillData.waybillNumber || waybillData.trackingNumber || '');
  if (!waybillNumber) {
    throw new WaybillServiceError({
      message: 'Waybill number is required before saving.',
      kind: 'invalid_input',
      code: 'app/invalid-waybill-number',
      operation: 'buildStoredWaybillFromFormData',
      retryable: false,
    });
  }
  const trackingNumber = normalizeWaybillLookupInput(waybillData.trackingNumber || waybillNumber);
  const origin = waybillData.portOfDeparture || waybillData.airportOfDeparture || 'Not provided';
  const destination = waybillData.portOfDestination || waybillData.airportOfDestination || 'Not provided';

  const suppliedEvents = Array.isArray(waybillData.trackingEvents) ? waybillData.trackingEvents : [];
  const timelineEvents = dedupeAndSortEvents(
    suppliedEvents.length > 0
      ? suppliedEvents.map((event) => ({
          status: event.status || 'Status Update',
          location: event.location || origin,
          description: event.description || 'No description provided.',
          eventTime: event.eventTime || now,
          isHold: Boolean(event.isHold),
          ...(typeof event.lat === 'number' && Number.isFinite(event.lat) ? { lat: event.lat } : {}),
          ...(typeof event.lng === 'number' && Number.isFinite(event.lng) ? { lng: event.lng } : {}),
        }))
      : createInitialTrackingEvents(origin)
  );

  const payload: Waybill = {
    ...waybillData,
    waybillNumber,
    trackingNumber,
    senderName: waybillData.senderName || waybillData.shipperName || '',
    senderPhone: waybillData.senderPhone || waybillData.shipperPhone || '',
    senderAddress: waybillData.senderAddress || waybillData.shipperAddress || '',
    receiverName: waybillData.receiverName || waybillData.consigneeName || '',
    receiverPhone: waybillData.receiverPhone || waybillData.consigneePhone || waybillData.receiverTelephone || '',
    receiverAddress: waybillData.receiverAddress || waybillData.consigneeAddress || '',
    origin,
    destination,
    iataCode: waybillData.iataCode || '',
    carrierReference: waybillData.carrierReference || '',
    shipmentMode: waybillData.transportMode || (waybillData.shipmentMode as string | undefined) || '',
    serviceType: normalizeServiceTypeLabel(waybillData),
    serviceTypeString: normalizeServiceTypeLabel(waybillData),
    deliveryType: (waybillData.deliveryType as Waybill['deliveryType']) || 'DOOR_TO_DOOR',
    parcelDescription: waybillData.cargoDescription || waybillData.packageDescription || waybillData.contents || '',
    cargoDescription: waybillData.cargoDescription || '',
    packageDescription: waybillData.packageDescription || waybillData.cargoDescription || '',
    quantity: waybillData.totalPieces || waybillData.pieces || waybillData.numberOfPieces || 1,
    totalPieces: waybillData.totalPieces || waybillData.pieces || waybillData.numberOfPieces || 1,
    weight: waybillData.totalWeight || waybillData.weight || 0,
    totalWeight: waybillData.totalWeight || waybillData.weight || 0,
    dimensions: waybillData.dimensions || '',
    currentStatus: waybillData.currentStatus || 'Shipment Created',
    currentLocation: waybillData.currentLocation || origin,
    bookingDate: waybillData.dateOfIssue || now,
    estimatedDeliveryDate: waybillData.estimatedArrivalDate || waybillData.estimatedDeliveryDate || waybillData.arrivalDate || '',
    deliveredDate: waybillData.deliveredDate || '',
    paymentStatus: waybillData.paymentStatus || 'NOT PAID',
    specialInstructions: waybillData.specialInstructions || '',
    createdAt: waybillData.createdAt || now,
    updatedAt: now,
    trackingEvents: timelineEvents,
  };

  return applyRuntimeToWaybill(payload);
}

async function syncRuntimeState(docRef: DocumentReference, data: Waybill): Promise<Waybill> {
  const timelineAlignment = applyLegacyTimelineDateAlignment(data);
  const runtimeWaybill = applyRuntimeToWaybill(timelineAlignment.waybill);
  const hasChanged =
    timelineAlignment.corrected ||
    runtimeWaybill.currentStatus !== data.currentStatus ||
    runtimeWaybill.currentLocation !== data.currentLocation ||
    runtimeWaybill.timelineOnHold !== data.timelineOnHold ||
    JSON.stringify(runtimeWaybill.trackingEvents) !== JSON.stringify(data.trackingEvents);

  if (hasChanged) {
    const updatePayload = sanitizeForFirestoreWrite({
      currentStatus: runtimeWaybill.currentStatus,
      currentLocation: runtimeWaybill.currentLocation,
      trackingEvents: runtimeWaybill.trackingEvents,
      timelineOnHold: runtimeWaybill.timelineOnHold,
      updatedAt: new Date().toISOString(),
      ...(timelineAlignment.corrected &&
        timelineAlignment.markerValue && {
          [LEGACY_TIMELINE_ALIGNMENT_MARKER_FIELD]: timelineAlignment.markerValue,
          [LEGACY_TIMELINE_ALIGNMENT_VERSION_FIELD]: LEGACY_TIMELINE_ALIGNMENT_VERSION,
        }),
      ...(runtimeWaybill.deliveredDate && { deliveredDate: runtimeWaybill.deliveredDate }),
    });
    // Best-effort, non-blocking persistence: public trackers cannot write
    // (admin-only rules) and the lookup must never wait on or fail from this —
    // the locally computed runtime state is returned either way.
    void runFirestoreOperation(
      'syncRuntimeState:updateDoc',
      () => updateDoc(docRef, updatePayload as Record<string, unknown>),
      { timeoutMs: FIREBASE_WRITE_TIMEOUT_MS, retries: FIREBASE_WRITE_RETRIES, silentKinds: ['permission'] }
    ).catch((persistError) => {
      if (!(isWaybillServiceError(persistError) && persistError.kind === 'permission')) {
        console.warn('[waybillService] runtime state persistence skipped:', persistError);
      }
    });
  }

  return runtimeWaybill;
}

export async function createWaybill(waybill: Waybill) {
  const normalizedWaybillNumber = normalizeWaybillLookupInput(waybill.waybillNumber || '');
  if (!normalizedWaybillNumber) {
    throw new WaybillServiceError({
      message: 'Waybill number is missing.',
      kind: 'invalid_input',
      code: 'app/invalid-waybill-number',
      operation: 'createWaybill',
      retryable: false,
    });
  }

  const now = new Date().toISOString();
  const payload: Waybill = applyRuntimeToWaybill({
    ...waybill,
    waybillNumber: normalizedWaybillNumber,
    trackingNumber: normalizeWaybillLookupInput(waybill.trackingNumber || normalizedWaybillNumber),
    createdAt: waybill.createdAt || now,
    updatedAt: now,
    trackingEvents: dedupeAndSortEvents(
      Array.isArray(waybill.trackingEvents) && waybill.trackingEvents.length > 0
        ? waybill.trackingEvents
        : createInitialTrackingEvents(waybill.origin || waybill.portOfDeparture || '')
    ),
  });

  const sanitizedPayload = sanitizeForFirestoreWrite(payload);
  const normalizedTrackingNumber = normalizeWaybillLookupInput(payload.trackingNumber || normalizedWaybillNumber);

  const docRef = doc(db, WAYBILLS_COLLECTION, normalizedWaybillNumber);
  await runFirestoreOperation(
    'createWaybill:setDoc',
    () => setDoc(docRef, sanitizedPayload as Waybill),
    { timeoutMs: FIREBASE_WRITE_TIMEOUT_MS, retries: FIREBASE_WRITE_RETRIES }
  );

  // If the tracking number differs from the waybill number, also store the same
  // document under the tracking number ID. This lets getWaybillByNumber resolve
  // tracking-number lookups via a direct getDoc (which is publicly allowed) instead
  // of falling back to a list query (which requires admin auth per Firestore rules).
  if (normalizedTrackingNumber && normalizedTrackingNumber !== normalizedWaybillNumber) {
    const trackingRef = doc(db, WAYBILLS_COLLECTION, normalizedTrackingNumber);
    await runFirestoreOperation(
      'createWaybill:setTrackingAlias',
      () => setDoc(trackingRef, sanitizedPayload as Waybill),
      { timeoutMs: FIREBASE_WRITE_TIMEOUT_MS, retries: FIREBASE_WRITE_RETRIES }
    );
  }
}

export async function getWaybillByNumber(waybillNumber: string): Promise<Waybill | null> {
  const normalizedLookup = normalizeWaybillLookupInput(waybillNumber);
  if (!normalizedLookup) return null;

  // First try direct doc lookup (primary path for current writes)
  const byIdRef = doc(db, WAYBILLS_COLLECTION, normalizedLookup);
  const byIdSnap = await runFirestoreOperation(
    'getWaybillByNumber:getDocById',
    () => getDoc(byIdRef),
    { timeoutMs: FIREBASE_READ_TIMEOUT_MS, retries: FIREBASE_READ_RETRIES }
  );
  if (byIdSnap.exists()) {
    const data = byIdSnap.data() as Waybill;
    // If this hit a tracking-number ALIAS doc, the primary doc (keyed by
    // waybillNumber) is authoritative — timeline updates are written there
    // and the alias may lag behind. Prefer the primary when it exists.
    const primaryId = normalizeWaybillLookupInput(data.waybillNumber || '');
    if (primaryId && primaryId !== normalizedLookup) {
      try {
        const primaryRef = doc(db, WAYBILLS_COLLECTION, primaryId);
        const primarySnap = await runFirestoreOperation(
          'getWaybillByNumber:getPrimaryDoc',
          () => getDoc(primaryRef),
          { timeoutMs: FIREBASE_READ_TIMEOUT_MS, retries: FIREBASE_READ_RETRIES }
        );
        if (primarySnap.exists()) {
          return syncRuntimeState(primaryRef, primarySnap.data() as Waybill);
        }
      } catch {
        // Fall back to the alias data on any failure
      }
    }
    return syncRuntimeState(byIdRef, data);
  }

  // Backward-compatible query by tracking number field. List queries are
  // admin-only per Firestore rules, so for public trackers a permission
  // denial here simply means "not found" (the direct doc lookup above is
  // the public path; new writes always create an alias doc for it).
  const byTracking = query(
    collection(db, WAYBILLS_COLLECTION),
    where('trackingNumber', '==', normalizedLookup)
  );
  let trackingSnapshot;
  try {
    trackingSnapshot = await runFirestoreOperation(
      'getWaybillByNumber:getByTrackingQuery',
      () => getDocs(byTracking),
      { timeoutMs: FIREBASE_READ_TIMEOUT_MS, retries: FIREBASE_READ_RETRIES, silentKinds: ['permission'] }
    );
  } catch (queryError) {
    if (isWaybillServiceError(queryError) && queryError.kind === 'permission') {
      return null;
    }
    throw queryError;
  }
  if (trackingSnapshot.empty) return null;
  const firstTracking = trackingSnapshot.docs[0];
  return syncRuntimeState(firstTracking.ref, firstTracking.data() as Waybill);
}

export async function updateWaybillTimeline(waybillNumber: string, events: TrackingEvent[]): Promise<Waybill | null> {
  const normalizedWaybillNumber = normalizeWaybillLookupInput(waybillNumber);
  if (!normalizedWaybillNumber) {
    throw new WaybillServiceError({
      message: 'Waybill number is required for timeline updates.',
      kind: 'invalid_input',
      code: 'app/invalid-waybill-number',
      operation: 'updateWaybillTimeline',
      retryable: false,
    });
  }

  const docRef = doc(db, WAYBILLS_COLLECTION, normalizedWaybillNumber);
  const snap = await runFirestoreOperation(
    'updateWaybillTimeline:getDoc',
    () => getDoc(docRef),
    { timeoutMs: FIREBASE_READ_TIMEOUT_MS, retries: FIREBASE_READ_RETRIES }
  );
  if (!snap.exists()) return null;

  const existing = snap.data() as Waybill;
  const nowIso = new Date().toISOString();
  const existingEvents = dedupeAndSortEvents(Array.isArray(existing.trackingEvents) ? existing.trackingEvents : []);
  const mergedEvents = dedupeAndSortEvents(events);
  const resumeAwareEvents = dedupeAndSortEvents(
    shiftEventsAfterHoldRelease(existingEvents, mergedEvents, Boolean(existing.timelineOnHold), nowIso)
  );
  const runtime = applyRuntimeToWaybill({
    ...existing,
    trackingEvents: resumeAwareEvents,
    updatedAt: nowIso,
  });

  const updatePayload = sanitizeForFirestoreWrite({
    trackingEvents: runtime.trackingEvents,
    currentStatus: runtime.currentStatus,
    currentLocation: runtime.currentLocation,
    timelineOnHold: runtime.timelineOnHold,
    updatedAt: runtime.updatedAt || nowIso,
    deliveredDate: runtime.deliveredDate || '',
  });

  await runFirestoreOperation(
    'updateWaybillTimeline:updateDoc',
    () => updateDoc(docRef, updatePayload as Record<string, unknown>),
    { timeoutMs: FIREBASE_WRITE_TIMEOUT_MS, retries: FIREBASE_WRITE_RETRIES }
  );

  // Keep the tracking-number alias doc in sync so public lookups by tracking
  // number see the updated timeline (createWaybill dual-writes both IDs).
  const aliasId = normalizeWaybillLookupInput(existing.trackingNumber || '');
  if (aliasId && aliasId !== normalizedWaybillNumber) {
    const aliasRef = doc(db, WAYBILLS_COLLECTION, aliasId);
    await runFirestoreOperation(
      'updateWaybillTimeline:syncAlias',
      () => setDoc(aliasRef, sanitizeForFirestoreWrite(runtime) as Waybill),
      { timeoutMs: FIREBASE_WRITE_TIMEOUT_MS, retries: FIREBASE_WRITE_RETRIES }
    );
  }

  return runtime;
}

export async function appendTrackingEvent(waybillNumber: string, event: TrackingEvent) {
  const normalizedWaybillNumber = normalizeWaybillLookupInput(waybillNumber);
  if (!normalizedWaybillNumber) {
    throw new WaybillServiceError({
      message: 'Waybill number is required to append tracking event.',
      kind: 'invalid_input',
      code: 'app/invalid-waybill-number',
      operation: 'appendTrackingEvent',
      retryable: false,
    });
  }

  const docRef = doc(db, WAYBILLS_COLLECTION, normalizedWaybillNumber);
  const snap = await runFirestoreOperation(
    'appendTrackingEvent:getDoc',
    () => getDoc(docRef),
    { timeoutMs: FIREBASE_READ_TIMEOUT_MS, retries: FIREBASE_READ_RETRIES }
  );

  if (!snap.exists()) return;

  const data = snap.data() as Waybill;
  const existing = Array.isArray(data.trackingEvents) ? data.trackingEvents : [];
  await updateWaybillTimeline(normalizedWaybillNumber, [...existing, event]);
}

export async function updateWaybillStatus(waybillNumber: string, status: string, location: string, description = '') {
  const normalizedWaybillNumber = normalizeWaybillLookupInput(waybillNumber);
  if (!normalizedWaybillNumber) {
    throw new WaybillServiceError({
      message: 'Waybill number is required to update status.',
      kind: 'invalid_input',
      code: 'app/invalid-waybill-number',
      operation: 'updateWaybillStatus',
      retryable: false,
    });
  }

  const docRef = doc(db, WAYBILLS_COLLECTION, normalizedWaybillNumber);
  const snap = await runFirestoreOperation(
    'updateWaybillStatus:getDoc',
    () => getDoc(docRef),
    { timeoutMs: FIREBASE_READ_TIMEOUT_MS, retries: FIREBASE_READ_RETRIES }
  );

  if (!snap.exists()) return;

  const data = snap.data() as Waybill;
  const nowIso = new Date().toISOString();
  const fallbackLocation = data.currentLocation || data.origin || 'Unknown Location';
  const event: TrackingEvent = {
    status: status.trim() || 'Status Update',
    location: (location || fallbackLocation).trim() || fallbackLocation,
    description: description || `Status updated to ${status}`,
    eventTime: nowIso,
    isHold: false,
  };

  const existing = Array.isArray(data.trackingEvents) ? data.trackingEvents : [];
  await updateWaybillTimeline(normalizedWaybillNumber, [...existing, event]);
}
