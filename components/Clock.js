import { useEffect, useState } from 'react';

// A multi-timezone digital clock with UI to add/remove zones. Zones are persisted to localStorage.
// Default zones are common ones; users can add IANA timezone names (e.g., "America/Los_Angeles").
export default function Clock({ initialZones }) {
  const defaultZones = initialZones || ["UTC","America/New_York","Europe/London","Asia/Tokyo","Australia/Sydney"];
  const [zones, setZones] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('clock_zones') : null;
      return raw ? JSON.parse(raw) : defaultZones;
    } catch (e) {
      return defaultZones;
    }
  });
  const [now, setNow] = useState(() => new Date());
  const [newZone, setNewZone] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('clock_zones', JSON.stringify(zones)); } catch (e) {}
  }, [zones]);

  function formatForZone(date, timeZone) {
    try {
      const fmt = new Intl.DateTimeFormat(undefined, {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone,
        month: 'short', day: '2-digit', weekday: 'short'
      });
      return fmt.format(date);
    } catch (e) {
      return 'Invalid zone';
    }
  }

  function addZone() {
    const tz = newZone.trim();
    if (!tz) return;
    // Validate by attempting to format
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch (e) {
      setErr('Invalid timezone name (use IANA names, e.g. "America/Los_Angeles").');
      return;
    }
    if (zones.includes(tz)) {
      setErr('Timezone already added');
      return;
    }
    setErr('');
    setZones((s) => [...s, tz]);
    setNewZone('');
  }

  function removeZone(zone) {
    setZones((s) => s.filter((z) => z !== zone));
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Add IANA timezone (e.g. America/Los_Angeles)"
          value={newZone}
          onChange={(e) => setNewZone(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={addZone}>Add</button>
      </div>
      {err && <div style={{ color: 'crimson', marginBottom: 8 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {zones.map((zone) => (
          <div key={zone} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 12, color: '#666' }}>{zone}</div>
              <button type="button" onClick={() => removeZone(zone)} style={{ background: 'transparent', border: 'none', color: '#d00', cursor: 'pointer' }}>Remove</button>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 20 }}>{formatForZone(now, zone)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
