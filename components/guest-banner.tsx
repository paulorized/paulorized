// Guest scan counter — no UI, just helpers used by ScanForm and strain search
export const GUEST_MAX = 10;
const STORAGE_KEY = 'cbai_guest_scans';

export function getGuestScanCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
}

export function incrementGuestScanCount(): number {
  const next = getGuestScanCount() + 1;
  localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}

export function isGuestLimitReached(): boolean {
  return getGuestScanCount() >= GUEST_MAX;
}
