import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { LatLng, LatLngExpression, Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useApp } from '../../store';
import { TextInput } from '../ui/TextInput';
import {
  nominatimReverse,
  nominatimSearch,
  projectFieldsFromHit,
  type GeocodeHit,
} from '../../utils/geocoding';
import { InfoHint } from '../ui/InfoHint';
import styles from './forms.module.css';
import geoStyles from './ProjectLocationForm.module.css';

function buildGeocodeQuery(d: {
  projectAddress: string;
  projectCity: string;
  projectState: string;
  projectZip: string;
}): string {
  return [d.projectAddress, d.projectCity, d.projectState, d.projectZip].filter((s) => s.trim()).join(', ');
}

export function ProjectLocationForm() {
  const { state, dispatch } = useApp();
  const d = state.data;
  const disabled = d.isFinalized;
  const update = useCallback(
    (payload: Record<string, string>) => dispatch({ type: 'UPDATE_DATA', payload }),
    [dispatch],
  );

  const queryString = useMemo(
    () =>
      buildGeocodeQuery({
        projectAddress: d.projectAddress,
        projectCity: d.projectCity,
        projectState: d.projectState,
        projectZip: d.projectZip,
      }),
    [d.projectAddress, d.projectCity, d.projectState, d.projectZip],
  );

  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedHit, setSelectedHit] = useState<GeocodeHit | null>(null);
  const [pending, setPending] = useState<ReturnType<typeof projectFieldsFromHit> | null>(null);
  const markerLatLngRef = useRef<{ lat: number; lon: number } | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const mapLoadGen = useRef(0);

  const mapEnabled = hits.length > 0;
  const mapFocus = selectedHit ?? hits[0] ?? null;

  const applyPending = () => {
    if (!pending || disabled) return;
    update(pending);
    setPending(null);
  };

  const pickHit = (hit: GeocodeHit) => {
    setSelectedHit(hit);
    setPending(projectFieldsFromHit(hit));
    markerLatLngRef.current = { lat: hit.lat, lon: hit.lon };
    if (mapRef.current && markerRef.current) {
      markerRef.current.setLatLng([hit.lat, hit.lon]);
      mapRef.current.setView([hit.lat, hit.lon], Math.max(mapRef.current.getZoom(), 16));
    }
  };

  const runSearch = useCallback(async () => {
    const q = queryString.trim();
    if (q.length < 8) {
      setHits([]);
      setGeoError(null);
      setPending(null);
      return;
    }
    searchAbortRef.current?.abort();
    const ac = new AbortController();
    searchAbortRef.current = ac;
    setGeoError(null);
    setGeoLoading(true);
    try {
      const list = await nominatimSearch(q, ac.signal);
      if (ac.signal.aborted) return;
      setHits(list);
      setSelectedHit((prev) => {
        if (!prev || list.length === 0) return null;
        return list.some((h) => h.lat === prev.lat && h.lon === prev.lon) ? prev : null;
      });
      if (list.length === 0) {
        setGeoError('No matches. Try simplifying or correcting spelling.');
        setPending(null);
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setGeoError(
        e instanceof Error
          ? e.message
          : 'Geocoding failed. If you are not using the Vite dev server, configure VITE_NOMINATIM_URL to a HTTPS proxy of Nominatim.',
      );
      setHits([]);
    } finally {
      if (!ac.signal.aborted) setGeoLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    const q = queryString.trim();
    if (q.length < 8) {
      setHits([]);
      setGeoError(null);
      setSelectedHit(null);
      setPending(null);
      markerLatLngRef.current = null;
      return;
    }
    const t = window.setTimeout(() => {
      void runSearch();
    }, 900);
    return () => window.clearTimeout(t);
  }, [queryString, runSearch]);

  /** Layout: map container stays mounted so ref is valid; avoids effect running before conditional DOM. */
  useLayoutEffect(() => {
    if (!mapEnabled || !mapContainerRef.current || !mapFocus) return;

    const gen = ++mapLoadGen.current;
    const el = mapContainerRef.current;
    const start = { lat: mapFocus.lat, lon: mapFocus.lon };
    markerLatLngRef.current = start;
    const center: LatLngExpression = [start.lat, start.lon];
    const zoom = 16;

    let cancelled = false;

    void (async () => {
      const [leafletMod] = await Promise.all([
        import('leaflet'),
        import('leaflet/dist/leaflet.css'),
      ]);
      if (cancelled || gen !== mapLoadGen.current) return;
      const L = leafletMod.default;

      if (!mapContainerRef.current) return;
      mapContainerRef.current.replaceChildren();

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }

      const defaultMarkerIcon = L.icon({
        iconUrl: markerIcon,
        iconRetinaUrl: markerIcon2x,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const map = L.map(el, { scrollWheelZoom: false }).setView(center, zoom);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const latlng = L.latLng(start.lat, start.lon);
      const marker = L.marker(latlng, { draggable: !disabled, icon: defaultMarkerIcon }).addTo(map);
      markerLatLngRef.current = { lat: latlng.lat, lon: latlng.lng };

      const reverseAt = async (ll: LatLng) => {
        if (disabled) return;
        try {
          const hit = await nominatimReverse(ll.lat, ll.lng);
          if (hit) setPending(projectFieldsFromHit(hit));
        } catch {
          setGeoError('Reverse lookup failed for that point.');
        }
      };

      marker.on('dragend', () => {
        const ll = marker.getLatLng();
        markerLatLngRef.current = { lat: ll.lat, lon: ll.lng };
        void reverseAt(ll);
      });

      map.on('click', (ev) => {
        if (disabled) return;
        const ll = ev.latlng;
        marker.setLatLng(ll);
        markerLatLngRef.current = { lat: ll.lat, lon: ll.lng };
        void reverseAt(ll);
      });

      if (cancelled || gen !== mapLoadGen.current) {
        map.remove();
        return;
      }

      mapRef.current = map;
      markerRef.current = marker;

      window.setTimeout(() => map.invalidateSize(), 80);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map remount when results/focus change; pickHit updates marker live
  }, [mapEnabled, disabled, mapFocus?.lat, mapFocus?.lon]);

  const pendingSummary = pending
    ? `${pending.projectAddress}, ${pending.projectCity}, ${pending.projectState} ${pending.projectZip}`.trim()
    : '';

  const hasPendingDiff =
    pending &&
    (pending.projectAddress !== d.projectAddress ||
      pending.projectCity !== d.projectCity ||
      pending.projectState !== d.projectState ||
      pending.projectZip !== d.projectZip);

  return (
    <div className={styles.form}>
      <div className={styles.formTitleRow}>
        <h2 className={styles.formTitle}>Project Location</h2>
        <InfoHint
          contextLabel="Project Location"
          text="Start from the map once you have a lookup result, or type the legal site address first and run Look up address."
        />
      </div>
      <TextInput
        label="Project Name"
        value={d.projectName}
        onChange={(v) => update({ projectName: v })}
        placeholder="e.g. Smith Residence"
        disabled={disabled}
      />

      <div
        ref={mapContainerRef}
        className={`${geoStyles.mapWrap} ${!mapEnabled ? geoStyles.mapPlaceholder : ''}`}
        aria-label={mapEnabled ? 'Map — click or drag pin' : 'Map preview — run address lookup to place pin'}
      >
        {!mapEnabled && <span>Search the address below to load the interactive map.</span>}
      </div>

      <div className={geoStyles.geoInline}>
        <p className={geoStyles.geoHint}>
          After you pause typing (or use <strong>Look up address</strong>), we query OpenStreetMap once the combined
          address is at least a few characters. Pick a row or move the map pin, then <strong>Apply to form</strong> when
          the suggestion looks right — your typed fields stay as-is until then.
        </p>
        <div className={geoStyles.geoActions}>
          <button
            type="button"
            className={geoStyles.lookupBtn}
            disabled={disabled || geoLoading || queryString.trim().length < 8}
            onClick={() => void runSearch()}
          >
            Look up address
          </button>
        </div>
        {(geoLoading || geoError) && (
          <p className={`${geoStyles.inlineStatus} ${geoError ? geoStyles.geoStatusError : ''}`}>
            {geoError || 'Looking up address…'}
          </p>
        )}

        {hits.length > 0 && (
          <div className={geoStyles.hitList} role="listbox" aria-label="Address matches">
            {hits.map((h) => {
              const active = selectedHit?.lat === h.lat && selectedHit?.lon === h.lon;
              return (
                <button
                  key={`${h.lat},${h.lon},${h.displayName.slice(0, 40)}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`${geoStyles.hitBtn} ${active ? geoStyles.hitBtnActive : ''}`}
                  disabled={disabled}
                  onClick={() => pickHit(h)}
                >
                  <div className={geoStyles.hitMain}>{projectFieldsFromHit(h).projectAddress || '—'}</div>
                  <div className={geoStyles.hitSub}>
                    {projectFieldsFromHit(h).projectCity}, {projectFieldsFromHit(h).projectState} {projectFieldsFromHit(h).projectZip}
                  </div>
                  <div className={geoStyles.hitSub}>{h.displayName}</div>
                </button>
              );
            })}
          </div>
        )}

        {pending && hasPendingDiff && (
          <div className={geoStyles.pendingBanner}>
            <div className={geoStyles.pendingText}>
              <strong>Suggested address</strong>
              <br />
              {pendingSummary}
            </div>
            <button type="button" className={geoStyles.applyBtn} onClick={applyPending} disabled={disabled}>
              Apply to form
            </button>
          </div>
        )}
      </div>

      <TextInput
        label="Street Address"
        value={d.projectAddress}
        onChange={(v) => update({ projectAddress: v })}
        placeholder="123 Main St"
        disabled={disabled}
        required
      />
      <div className={styles.row3}>
        <TextInput label="City" value={d.projectCity} onChange={(v) => update({ projectCity: v })} disabled={disabled} required />
        <TextInput label="State" value={d.projectState} onChange={(v) => update({ projectState: v })} disabled={disabled} required />
        <TextInput label="Zip" value={d.projectZip} onChange={(v) => update({ projectZip: v })} disabled={disabled} required />
      </div>
    </div>
  );
}
