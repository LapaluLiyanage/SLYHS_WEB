import { useEffect, useState } from 'react';
import { getAnimals } from './api';
import { SPECIES } from '../pages/speciesData';

/* Animals added in the admin panel (table `animals`) are appended to the built-in species list.
   They are fetched once per visit; the species guide and the Learn pages then show them like any other. */

const safeImg = (u) => (typeof u === 'string' && /^https:\/\//i.test(u.trim()) ? u.trim() : '');

/** "Label: value" lines -> [[label, value], ...] */
export const parseFacts = (text) => String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
  const i = l.indexOf(':');
  return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : ['Note', l];
});

function toSpecies(r) {
  return {
    remote: true, name: r.name, sci: r.sci || '', local: r.local_name || '', kind: r.kind, group: r.group_text || r.kind,
    status: r.status || '', venom: r.danger === 'venomous', harmless: r.danger === 'harmless', endemic: r.endemic !== false,
    sizeLabel: r.size_label || '', img: safeImg(r.image_url), credit: r.credit || '', desc: r.description || '', facts: parseFacts(r.facts), pos: '50% 50%'
  };
}

let cache; // undefined = not fetched yet, null = database unreachable, array = rows
let version = 0;
const listeners = new Set();

function merge(rows) {
  for (let i = SPECIES.length - 1; i >= 0; i -= 1) if (SPECIES[i].remote) SPECIES.splice(i, 1);
  (rows || []).forEach((r) => {
    if (!r || !r.name) return;
    const base = SPECIES.find((s) => s.name === r.name && !s.remote);
    if (!base) { SPECIES.push(toSpecies(r)); return; }
    // a built-in animal edited in the admin panel: only filled-in fields replace the built-in ones
    const n = toSpecies(r);
    ['sci', 'local', 'group', 'status', 'sizeLabel', 'img', 'credit', 'desc'].forEach((k) => { if (n[k]) base[k] = n[k]; });
    if (n.facts.length) base.facts = n.facts;
    if (r.danger) { base.venom = n.venom; base.harmless = n.harmless; }
    base.endemic = n.endemic;
    if (n.img) base.file = '';
  });
  version += 1;
  listeners.forEach((fn) => fn(version));
}

/** Loads the admin-added animals once and re-renders the caller when they arrive. Returns a version number. */
export default function useAnimals() {
  const [v, setV] = useState(version);
  useEffect(() => {
    listeners.add(setV);
    if (cache === undefined) {
      cache = null;
      getAnimals().then((rows) => { cache = rows || []; merge(cache); });
    } else if (Array.isArray(cache) && v !== version) {
      setV(version);
    }
    return () => { listeners.delete(setV); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}
