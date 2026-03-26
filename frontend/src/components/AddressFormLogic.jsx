import { useEffect, useRef, useState, useCallback } from 'react';
import { Form, Spinner } from 'react-bootstrap';
import axios from 'axios';

/**
 * Nominatim axios instance — separate from the app's API instance.
 * Uses a custom User-Agent header as required by OpenStreetMap usage policy.
 */
const nominatim = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  headers: { 'User-Agent': 'PropertyManagementApp/1.0' }
});

/**
 * AddressFormLogic — Smart bidirectional address auto-completion component.
 *
 * Props:
 *   register   — react-hook-form register function
 *   setValue    — react-hook-form setValue function
 *   watch      — react-hook-form watch function
 *   errors     — react-hook-form errors object
 *   prefix     — optional field name prefix (e.g. 'address.' for nested forms)
 *   disabled   — disable all fields
 */
export default function AddressFormLogic({
  register,
  setValue,
  watch,
  errors,
  prefix = '',
  disabled = false
}) {
  const f = (name) => `${prefix}${name}`;

  const [isSearching, setIsSearching] = useState(false);
  const [postalHint, setPostalHint] = useState('');

  // ── Infinite-loop prevention ────────────────────────
  // When Flow 1 (postal → address) auto-fills county/city/street via setValue,
  // those changes would trigger Flow 2 (address → postal) through the watch.
  // This ref acts as a guard: while true, Flow 2 is suppressed.
  const isAutoFilling = useRef(false);

  // ── Debounce timers ─────────────────────────────────
  const postalTimerRef = useRef(null);
  const addressTimerRef = useRef(null);

  // Watch all four fields
  const postalCode = watch(f('postalCode'), '');
  const county = watch(f('county'), '');
  const city = watch(f('city'), '');
  const street = watch(f('street'), '');

  // ── Helper: extract address parts from Nominatim response ──
  const extractAddress = (addr) => ({
    county: addr.county || addr.state || '',
    city: addr.city || addr.town || addr.village || addr.municipality || '',
    street: addr.road || '',
    postcode: addr.postcode || ''
  });

  // ── FLOW 1: Postal Code (6 digits) → Address ───────
  const fetchByPostalCode = useCallback(async (code) => {
    setIsSearching(true);
    setPostalHint('');
    try {
      const { data } = await nominatim.get('/search', {
        params: {
          postalcode: code,
          country: 'romania',
          format: 'json',
          addressdetails: 1
        }
      });

      if (data.length > 0) {
        const addr = extractAddress(data[0].address);

        // Set flag BEFORE calling setValue so Flow 2 doesn't fire
        isAutoFilling.current = true;

        if (addr.county) setValue(f('county'), addr.county, { shouldValidate: true });
        if (addr.city) setValue(f('city'), addr.city, { shouldValidate: true });
        if (addr.street) setValue(f('street'), addr.street, { shouldValidate: true });

        // Release guard after React has processed the setValue calls
        requestAnimationFrame(() => {
          isAutoFilling.current = false;
        });
      } else {
        setPostalHint('Codul poștal nu a returnat rezultate. Te rugăm să completezi județul și orașul manual.');
      }
    } catch {
      setPostalHint('Eroare la căutare. Completează manual.');
    } finally {
      setIsSearching(false);
    }
  }, [setValue, prefix]);

  // ── FLOW 2: Address (county + city + street) → Postal Code ──
  const fetchByAddress = useCallback(async (countyVal, cityVal, streetVal) => {
    setIsSearching(true);
    try {
      const params = {
        country: 'romania',
        format: 'json',
        addressdetails: 1
      };
      if (countyVal) params.county = countyVal;
      if (cityVal) params.city = cityVal;
      if (streetVal) params.street = streetVal;

      const { data } = await nominatim.get('/search', { params });

      if (data.length > 0) {
        const addr = extractAddress(data[0].address);
        if (addr.postcode) {
          // Guard not needed here — postal code change won't re-trigger Flow 2
          // and Flow 1 only fires on exactly 6 digits (which a postcode already is,
          // but the debounce + guard protect against loops regardless).
          isAutoFilling.current = true;
          setValue(f('postalCode'), addr.postcode, { shouldValidate: true });
          requestAnimationFrame(() => {
            isAutoFilling.current = false;
          });
        }
      }
    } catch {
      // Silent fail — user can always type manually
    } finally {
      setIsSearching(false);
    }
  }, [setValue, prefix]);

  // ── Effect: watch postalCode → debounced Flow 1 ────
  useEffect(() => {
    // Only trigger on exactly 6 digits
    if (!/^\d{6}$/.test(postalCode)) {
      setPostalHint('');
      return;
    }

    // Don't trigger if an auto-fill just set this value
    if (isAutoFilling.current) return;

    clearTimeout(postalTimerRef.current);
    postalTimerRef.current = setTimeout(() => {
      fetchByPostalCode(postalCode);
    }, 900);

    return () => clearTimeout(postalTimerRef.current);
  }, [postalCode, fetchByPostalCode]);

  // ── Effect: watch county + city + street → debounced Flow 2 ──
  useEffect(() => {
    // ── LOOP PREVENTION: skip when Flow 1 just auto-filled these fields ──
    if (isAutoFilling.current) return;

    // Need at least city to make a useful search
    if (!city || city.length < 2) return;

    clearTimeout(addressTimerRef.current);
    addressTimerRef.current = setTimeout(() => {
      // Double-check the guard hasn't been set in the meantime
      if (!isAutoFilling.current) {
        fetchByAddress(county, city, street);
      }
    }, 1000);

    return () => clearTimeout(addressTimerRef.current);
  }, [county, city, street, fetchByAddress]);

  // ── Cleanup timers on unmount ──
  useEffect(() => {
    return () => {
      clearTimeout(postalTimerRef.current);
      clearTimeout(addressTimerRef.current);
    };
  }, []);

  const err = (name) => {
    // Support nested error paths (e.g. prefix = 'address.')
    const parts = f(name).split('.');
    let obj = errors;
    for (const p of parts) {
      obj = obj?.[p];
    }
    return obj;
  };

  return (
    <>
      {/* ── Cod Poștal ─────────────────────────── */}
      <Form.Group className="mb-3">
        <Form.Label>
          Cod Poștal
          {isSearching && <Spinner animation="border" size="sm" className="ms-2" />}
        </Form.Label>
        <Form.Control
          type="text"
          maxLength={6}
          placeholder="ex: 010101"
          disabled={disabled}
          isInvalid={!!err('postalCode')}
          {...register(f('postalCode'))}
        />
        <Form.Control.Feedback type="invalid">
          {err('postalCode')?.message}
        </Form.Control.Feedback>
        {postalHint && (
          <Form.Text className="text-muted">{postalHint}</Form.Text>
        )}
      </Form.Group>

      {/* ── Județ / Sector ─────────────────────── */}
      <Form.Group className="mb-3">
        <Form.Label>
          Județ / Sector
          {isSearching && <Spinner animation="border" size="sm" className="ms-2" />}
        </Form.Label>
        <Form.Control
          type="text"
          placeholder="ex: București / Ilfov"
          disabled={disabled}
          isInvalid={!!err('county')}
          {...register(f('county'))}
        />
        <Form.Control.Feedback type="invalid">
          {err('county')?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {/* ── Oraș / Comună / Sat ────────────────── */}
      <Form.Group className="mb-3">
        <Form.Label>
          Oraș / Comună
          {isSearching && <Spinner animation="border" size="sm" className="ms-2" />}
        </Form.Label>
        <Form.Control
          type="text"
          placeholder="ex: București"
          disabled={disabled}
          isInvalid={!!err('city')}
          {...register(f('city'))}
        />
        <Form.Control.Feedback type="invalid">
          {err('city')?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {/* ── Stradă ─────────────────────────────── */}
      <Form.Group className="mb-3">
        <Form.Label>Stradă</Form.Label>
        <Form.Control
          type="text"
          placeholder="ex: Strada Victoriei"
          disabled={disabled}
          isInvalid={!!err('street')}
          {...register(f('street'))}
        />
        <Form.Control.Feedback type="invalid">
          {err('street')?.message}
        </Form.Control.Feedback>
      </Form.Group>
    </>
  );
}
