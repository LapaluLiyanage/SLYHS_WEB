import { useEffect, useState } from 'react';
import { FP } from '../pages/speciesData';

export const speciesSlug = (name) => name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * Photo URLs for species: a bundled image or Commons file when the data has one, otherwise the
 * lead photo of the species' Wikipedia article. Returns a function (species, width) -> url or ''.
 */
export default function useSpeciesPhotos(list) {
  const [files, setFiles] = useState({});

  useEffect(() => {
    let dead = false;
    list.forEach((s) => {
      if (s.img || s.file || !s.wiki) return;
      fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + s.wiki).then((r) => r.json()).then((j) => {
        const src = (j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source);
        if (!src || dead) return;
        const parts = src.split('?')[0].split('/');
        const f = decodeURIComponent(src.includes('/thumb/') ? parts[parts.length - 2] : parts[parts.length - 1]);
        setFiles((st) => ({ ...st, [s.name]: f }));
      }).catch(() => {});
    });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.map((s) => s.name).join('|')]);

  return (s, width) => {
    const f = s.file || files[s.name];
    return s.img || (f ? FP(f) + '?width=' + width : '');
  };
}
