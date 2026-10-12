import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap, prefersReducedMotion } from '../lib/gsap';

const MAX_HEIGHT = 300;

/**
 * Styled replacement for <select> (native option menus can't be themed).
 * ARIA combobox + listbox pattern: focus stays on the trigger, the active option
 * is exposed via aria-activedescendant. Keyboard: arrows, Home/End, PageUp/Down,
 * Enter/Space, Escape, Tab, and type-to-search (also works while closed).
 */
export default function GlassSelect({ name, value, onChange, error, placeholder, options }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const typeBuf = useRef({ text: '', at: 0 });

  const listId = `${name}-listbox`;
  const optId = (i) => `${name}-opt-${i}`;
  const selIndex = options.indexOf(value);

  const place = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    if (window.innerWidth < 640) { setPos({ sheet: true }); return; }
    const r = btn.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < Math.min(MAX_HEIGHT, 220) && above > below;
    setPos({
      left: r.left,
      width: r.width,
      top: up ? undefined : r.bottom + 8,
      bottom: up ? window.innerHeight - r.top + 8 : undefined,
      maxHeight: Math.max(140, Math.min(MAX_HEIGHT, up ? above : below)),
      up
    });
  }, []);

  const openList = (start) => {
    place();
    setActive(start ?? (selIndex >= 0 ? selIndex : 0));
    setOpen(true);
  };
  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);
  const choose = (i) => {
    if (i < 0 || i >= options.length) return;
    onChange(name, options[i]);
    close();
  };

  // type-to-search: repeated single letters cycle through matches
  const typeahead = (ch) => {
    const now = performance.now();
    const buf = typeBuf.current;
    buf.text = now - buf.at > 700 ? ch : buf.text + ch;
    buf.at = now;
    const q = buf.text.toLowerCase();
    const cycling = q.length > 1 && q.split('').every((c) => c === q[0]);
    const needle = cycling ? q[0] : q;
    const from = open ? active : selIndex;
    const start = cycling || q.length === 1 ? from + 1 : Math.max(from, 0);
    for (let k = 0; k < options.length; k++) {
      const i = (start + k) % options.length;
      if (options[i].toLowerCase().startsWith(needle)) {
        if (open) setActive(i); else onChange(name, options[i]);
        return;
      }
    }
  };

  const onKeyDown = (e) => {
    const k = e.key;
    if (!open) {
      if (k === 'ArrowDown' || k === 'Enter' || k === ' ') { e.preventDefault(); openList(); }
      else if (k === 'ArrowUp') { e.preventDefault(); openList(selIndex > 0 ? selIndex - 1 : 0); }
      else if (k.length === 1 && /\S/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(k);
      return;
    }
    const last = options.length - 1;
    const move = (i) => { e.preventDefault(); setActive(Math.max(0, Math.min(last, i))); };
    if (k === 'ArrowDown') move(active + 1);
    else if (k === 'ArrowUp') move(active - 1);
    else if (k === 'Home') move(0);
    else if (k === 'End') move(last);
    else if (k === 'PageDown') move(active + 8);
    else if (k === 'PageUp') move(active - 8);
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(active); }
    else if (k === 'Escape') { e.preventDefault(); close(); }
    else if (k === 'Tab') close(false);
    else if (k.length === 1 && /\S/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(k);
  };

  // follow the trigger while the page scrolls or resizes
  useEffect(() => {
    if (!open) return undefined;
    let raf = 0;
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove); };
  }, [open, place]);

  // click outside closes
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      close(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, close]);

  // open animation
  useLayoutEffect(() => {
    if (!open || !listRef.current || prefersReducedMotion) return;
    gsap.fromTo(listRef.current,
      pos?.sheet ? { opacity: 0, y: 70 } : { opacity: 0, y: pos?.up ? 8 : -8, scale: .98 },
      { opacity: 1, y: 0, scale: 1, duration: pos?.sheet ? .4 : .28, ease: 'power3.out' });
    gsap.fromTo(listRef.current.children, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: .3, ease: 'power2.out', stagger: .012, delay: .04 });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the active option in view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[active];
    if (!el) return;
    const list = listRef.current;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop - 6;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight + 6;
  }, [active, open]);

  return (
    <>
      <button
        ref={btnRef}
        id={name}
        type="button"
        role="combobox"
        className="gs-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${name}-label ${name}`}
        aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
        aria-invalid={!!error}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={value ? 'gs-value' : 'gs-value gs-placeholder'}>{value || placeholder}</span>
        <svg className="gs-chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && pos && createPortal(
        <>
        {pos.sheet && <div className="sheet-backdrop" aria-hidden="true" />}
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={`${name}-label`}
          className={'gs-list' + (pos.up ? ' is-up' : '') + (pos.sheet ? ' is-sheet' : '')}
          data-lenis-prevent
          onMouseDown={(e) => e.preventDefault()} // keep focus on the trigger
          style={pos.sheet ? undefined : { left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
        >
          {options.map((o, i) => (
            <li
              key={o}
              id={optId(i)}
              role="option"
              aria-selected={o === value}
              className={'gs-opt' + (i === active ? ' is-active' : '') + (o === value ? ' is-selected' : '')}
              onPointerMove={() => { if (i !== active) setActive(i); }}
              onClick={() => choose(i)}
            >
              <span>{o}</span>
              <svg className="gs-check" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M3 7.3 5.8 10 11 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </li>
          ))}
        </ul>
        </>,
        document.body
      )}
    </>
  );
}
