/**
 * OpenStreetMap Nominatim (forward + reverse).
 * In dev / `vite preview`, requests go through `/api/nominatim` (see vite.config.ts) to satisfy browser same-origin + User-Agent policy.
 * For other production hosts, set `VITE_NOMINATIM_URL` to your HTTPS reverse proxy of nominatim.openstreetmap.org.
 */

const NOMINATIM_BASE =
  typeof import.meta.env.VITE_NOMINATIM_URL === 'string' && import.meta.env.VITE_NOMINATIM_URL.trim()
    ? import.meta.env.VITE_NOMINATIM_URL.replace(/\/$/, '')
    : '/api/nominatim';

export type NominatimAddress = Record<string, string | undefined>;

export interface GeocodeHit {
  lat: number;
  lon: number;
  displayName: string;
  address: NominatimAddress;
}

function mapNominatimRow(raw: Record<string, unknown>): GeocodeHit | null {
  const lat = parseFloat(String(raw.lat));
  const lon = parseFloat(String(raw.lon));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const displayName = typeof raw.display_name === 'string' ? raw.display_name : '';
  const addr = raw.address && typeof raw.address === 'object' ? (raw.address as NominatimAddress) : {};
  return { lat, lon, displayName, address: addr };
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${NOMINATIM_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) throw new Error(`Geocoder HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

/** Forward search (address → candidates). */
export async function nominatimSearch(query: string, signal?: AbortSignal): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 4) return [];
  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    limit: '6',
    q,
  });
  const rows = await fetchJson<Record<string, unknown>[]>(`/search?${params}`, signal);
  if (!Array.isArray(rows)) return [];
  return rows.map(mapNominatimRow).filter((h): h is GeocodeHit => h != null);
}

/** Reverse (coordinates → one place). */
export async function nominatimReverse(lat: number, lon: number, signal?: AbortSignal): Promise<GeocodeHit | null> {
  const params = new URLSearchParams({
    format: 'json',
    addressdetails: '1',
    lat: String(lat),
    lon: String(lon),
  });
  const raw = await fetchJson<Record<string, unknown>>(`/reverse?${params}`, signal);
  return mapNominatimRow(raw);
}

/** Map Nominatim `address` into our project location fields (US-oriented; best-effort elsewhere). */
export function projectFieldsFromHit(hit: GeocodeHit): {
  projectAddress: string;
  projectCity: string;
  projectState: string;
  projectZip: string;
} {
  const a = hit.address;
  const hn = (a.house_number || '').trim();
  const road = (a.road || a.pedestrian || a.residential || a.neighbourhood || '').trim();
  const street = [hn, road].filter(Boolean).join(' ').trim();
  const city =
    a.city ||
    a.town ||
    a.village ||
    a.hamlet ||
    a.municipality ||
    a.suburb ||
    '';
  const state = a.state || a.region || '';
  const zip = (a.postcode || '').trim();
  const fallbackLine =
    hit.displayName
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2)
      .join(', ') || '';
  return {
    projectAddress: street || fallbackLine,
    projectCity: (city || '').trim(),
    projectState: (state || '').trim(),
    projectZip: zip,
  };
}
