import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap, prefersReducedMotion } from '../lib/gsap';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MIN_ISO = '1900-01-01';
const POP_W = 304;
const POP_H = 372;

const pad = (n) => String(n).padStart(2, '0');
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1 ? d : null;
};
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const fmt = (s) => {
  const d = fromISO(s);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}` : '';
};

/**
 * Styled replacement for <input type="date"> (the browser's calendar can't be themed).
 * Value is an ISO string (yyyy-mm-dd), same as the native input, so validation is unchanged.
 * Views: days → years → months → days. Keyboard in the day grid: arrows, Home/End,
 * PageUp/PageDown (month), Shift+PageUp/PageDown (year), Enter/Space, Escape; Tab is trapped.
 */
export default function GlassDate({ name, value, onChange, error, placeholder = 'Choose date' }) {
  const todayISO = toISO(new Date());
  const selected = fromISO(value);
  const startFocus = () => selected || fromISO(`${new Date().getFullYear() - 18}-${pad(new Date().getMonth() + 1)}-01`) || new Date();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState('days'); // days | months | years
  const [cursor, setCursor] = useState(startFocus); // focused date
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const focusGrid = useRef(false);

  const place = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < POP_H && above > below;
    setPos({
      left: Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - POP_W - 8)),
      top: up ? undefined : r.bottom + 8,
      bottom: up ? window.innerHeight - r.top + 8 : undefined,
      up
    });
  }, []);

  const openPicker = () => {
    setCursor(startFocus());
    setView('days');
    place();
    focusGrid.current = true;
    setOpen(true);
  };
  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
  }, []);

  const pick = (d) => {
    const iso = toISO(d);
    if (iso > todayISO || iso < MIN_ISO) return;
    onChange(name, iso);
    close();
  };

  const clampDate = (d) => {
    const iso = toISO(d);
    if (iso > todayISO) return fromISO(todayISO);
    if (iso < MIN_ISO) return fromISO(MIN_ISO);
    return d;
  };
  const shiftMonths = (d, n) => {
    const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
    return clampDate(new Date(t.getFullYear(), t.getMonth(), Math.min(d.getDate(), last)));
  };

  /* ---- outside click / follow scroll ---- */
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      close(false);
    };
    let raf = 0;
    const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open, close, place]);

  /* ---- animation ---- */
  useLayoutEffect(() => {
    if (!open || !popRef.current || prefersReducedMotion) return;
    gsap.fromTo(popRef.current, { opacity: 0, y: pos?.up ? 8 : -8, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .28, ease: 'power3.out' });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!open || !popRef.current || prefersReducedMotion) return;
    const body = popRef.current.querySelector('.dp-body');
    if (body) gsap.fromTo(body, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .24, ease: 'power2.out' });
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- keep keyboard focus on the active cell ---- */
  useEffect(() => {
    if (!open || !popRef.current || !focusGrid.current) return;
    const el = popRef.current.querySelector('[data-focus="true"]');
    if (el) el.focus({ preventScroll: true });
  });

  /* ---- keyboard ---- */
  const onPopKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); return; }
    if (e.key === 'Tab') {
      const items = [...popRef.current.querySelectorAll('button:not([disabled]):not([tabindex="-1"])')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      return;
    }
    if (!e.target.closest('.dp-grid')) return;
    focusGrid.current = true;
    const k = e.key;
    let next = null;
    if (view === 'days') {
      if (k === 'ArrowLeft') next = addDays(cursor, -1);
      else if (k === 'ArrowRight') next = addDays(cursor, 1);
      else if (k === 'ArrowUp') next = addDays(cursor, -7);
      else if (k === 'ArrowDown') next = addDays(cursor, 7);
      else if (k === 'Home') next = addDays(cursor, -((cursor.getDay() + 6) % 7));
      else if (k === 'End') next = addDays(cursor, 6 - ((cursor.getDay() + 6) % 7));
      else if (k === 'PageUp') next = shiftMonths(cursor, e.shiftKey ? -12 : -1);
      else if (k === 'PageDown') next = shiftMonths(cursor, e.shiftKey ? 12 : 1);
    } else if (view === 'months') {
      const m = cursor.getMonth();
      const mv = (n) => shiftMonths(cursor, n);
      if (k === 'ArrowLeft') next = mv(-1);
      else if (k === 'ArrowRight') next = mv(1);
      else if (k === 'ArrowUp') next = mv(-3);
      else if (k === 'ArrowDown') next = mv(3);
      else if (k === 'Home') next = mv(-m);
      else if (k === 'End') next = mv(11 - m);
    } else {
      const y = cursor.getFullYear();
      const jump = (n) => clampDate(new Date(y + n, cursor.getMonth(), 1));
      if (k === 'ArrowLeft') next = jump(-1);
      else if (k === 'ArrowRight') next = jump(1);
      else if (k === 'ArrowUp') next = jump(-4);
      else if (k === 'ArrowDown') next = jump(4);
    }
    if (next) { e.preventDefault(); setCursor(clampDate(next)); return; }
    if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      if (view === 'days') pick(cursor);
      else if (view === 'years') setView('months');
      else setView('days');
    }
  };

  /* ---- header ---- */
  const cy = cursor.getFullYear();
  const yearBase = cy - (cy % 12);
  const title = view === 'days' ? `${MONTHS[cursor.getMonth()]} ${cy}` : view === 'months' ? String(cy) : `${yearBase} – ${yearBase + 11}`;
  const step = (dir) => {
    focusGrid.current = false;
    setCursor((c) => clampDate(view === 'days' ? shiftMonths(c, dir) : view === 'months' ? shiftMonths(c, dir * 12) : shiftMonths(c, dir * 144)));
  };
  const atMin = (cy <= 1900 && view !== 'days') || (view === 'days' && toISO(new Date(cy, cursor.getMonth(), 1)) <= MIN_ISO);
  const atMax = view === 'days' ? toISO(new Date(cy, cursor.getMonth() + 1, 1)) > todayISO : view === 'months' ? cy >= new Date().getFullYear() : yearBase + 12 > new Date().getFullYear();

  /* ---- cells ---- */
  const dayCells = () => {
    const first = new Date(cy, cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(cy, cursor.getMonth(), 1 - offset + i);
      const iso = toISO(d);
      return { d, iso, inMonth: d.getMonth() === cursor.getMonth(), disabled: iso > todayISO || iso < MIN_ISO, isSel: iso === value, isToday: iso === todayISO, isFocus: iso === toISO(cursor) };
    });
  };

  const display = fmt(value);

  return (
    <>
      <button
        ref={btnRef}
        id={name}
        type="button"
        className="gs-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-labelledby={`${name}-label ${name}`}
        aria-invalid={!!error}
        onClick={() => (open ? close() : openPicker())}
        onKeyDown={(e) => { if (!open && e.key === 'ArrowDown') { e.preventDefault(); openPicker(); } }}
      >
        <span className={display ? 'gs-value' : 'gs-value gs-placeholder'}>{display || placeholder}</span>
        <svg className="dp-icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="2" y="3" width="12" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M2 6.5h12M5.5 1.8v2.6M10.5 1.8v2.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open && pos && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Choose date"
          className={'dp-pop' + (pos.up ? ' is-up' : '')}
          style={{ left: pos.left, width: POP_W, top: pos.top, bottom: pos.bottom }}
          onMouseDown={(e) => { if (!e.target.closest('button')) e.preventDefault(); }}
          onKeyDown={onPopKeyDown}
        >
          <div className="dp-head">
            <button type="button" className="dp-nav" aria-label="Previous" disabled={atMin} onClick={() => step(-1)}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 3 4.5 7l4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="dp-title" aria-live="polite"
              onClick={() => { focusGrid.current = false; setView(view === 'days' ? 'years' : view === 'years' ? 'months' : 'days'); }}>
              {title}
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 3.8 5 6.8l3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="dp-nav" aria-label="Next" disabled={atMax} onClick={() => step(1)}>
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M5.5 3 9.5 7l-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>

          <div className="dp-body">
            {view === 'days' && (
              <>
                <div className="dp-week" aria-hidden="true">{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
                <div className="dp-grid dp-days" role="grid" aria-label={title}>
                  {dayCells().map((c) => (
                    <button
                      key={c.iso}
                      type="button"
                      role="gridcell"
                      tabIndex={c.isFocus ? 0 : -1}
                      data-focus={c.isFocus}
                      disabled={c.disabled}
                      aria-selected={c.isSel}
                      aria-current={c.isToday ? 'date' : undefined}
                      aria-label={`${c.d.getDate()} ${MONTHS[c.d.getMonth()]} ${c.d.getFullYear()}`}
                      className={'dp-day' + (c.inMonth ? '' : ' is-out') + (c.isSel ? ' is-sel' : '') + (c.isToday ? ' is-today' : '')}
                      onClick={() => pick(c.d)}
                    >{c.d.getDate()}</button>
                  ))}
                </div>
              </>
            )}

            {view === 'months' && (
              <div className="dp-grid dp-cols3" role="grid" aria-label={`Months of ${cy}`}>
                {MONTHS.map((m, i) => {
                  const disabled = toISO(new Date(cy, i, 1)) > todayISO;
                  const isFocus = i === cursor.getMonth();
                  const isSel = selected && selected.getFullYear() === cy && selected.getMonth() === i;
                  return (
                    <button key={m} type="button" role="gridcell" tabIndex={isFocus ? 0 : -1} data-focus={isFocus} disabled={disabled}
                      aria-selected={!!isSel} className={'dp-cell' + (isSel ? ' is-sel' : '')}
                      onClick={() => { focusGrid.current = true; setCursor(clampDate(new Date(cy, i, Math.min(cursor.getDate(), 28)))); setView('days'); }}>
                      {m.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'years' && (
              <div className="dp-grid dp-cols3" role="grid" aria-label="Years">
                {Array.from({ length: 12 }, (_, i) => yearBase + i).map((y) => {
                  const disabled = y > new Date().getFullYear() || y < 1900;
                  const isFocus = y === cy;
                  const isSel = selected && selected.getFullYear() === y;
                  return (
                    <button key={y} type="button" role="gridcell" tabIndex={isFocus ? 0 : -1} data-focus={isFocus} disabled={disabled}
                      aria-selected={!!isSel} className={'dp-cell' + (isSel ? ' is-sel' : '')}
                      onClick={() => { focusGrid.current = true; setCursor(clampDate(new Date(y, cursor.getMonth(), 1))); setView('months'); }}>
                      {y}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="dp-foot">
            <button type="button" className="dp-link" onClick={() => { onChange(name, ''); close(); }}>Clear</button>
            <button type="button" className="dp-link" onClick={() => pick(new Date())}>Today</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
