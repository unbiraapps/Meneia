// Dibujos planos de las frutas para el tamaño durante el embarazo (originales, colores suaves).
import type { ReactElement } from 'react';
import type { FruitId } from '../embarazo';

const P: Record<FruitId, ReactElement> = {
  frambuesa: <>
    <path d="M32 12c-3-5-9-6-12-3 4 0 7 2 9 5" fill="#7FB38A" /><path d="M32 12c3-5 9-6 12-3-4 0-7 2-9 5" fill="#7FB38A" />
    <g fill="#D46A86"><circle cx="24" cy="24" r="7" /><circle cx="34" cy="22" r="7" /><circle cx="42" cy="28" r="7" /><circle cx="20" cy="34" r="7" /><circle cx="30" cy="33" r="7" /><circle cx="40" cy="38" r="7" /><circle cx="25" cy="44" r="7" /><circle cx="34" cy="47" r="6.5" /></g>
    <g fill="#F2A3B6" opacity=".7"><circle cx="22" cy="22" r="2" /><circle cx="32" cy="20" r="2" /><circle cx="28" cy="31" r="2" /><circle cx="38" cy="36" r="2" /></g>
  </>,
  lima: <>
    <circle cx="32" cy="34" r="20" fill="#7BB661" /><circle cx="32" cy="34" r="15" fill="#A8D58A" />
    <g stroke="#7BB661" strokeWidth="2"><path d="M32 19v30M17 34h30M21.5 23.5l21 21M42.5 23.5l-21 21" /></g><circle cx="32" cy="34" r="3" fill="#E5F2D5" />
  </>,
  palta: <>
    <path d="M32 6c-8 0-12 10-13 18-1 6-7 11-7 20 0 10 9 16 20 16s20-6 20-16c0-9-6-14-7-20C44 16 40 6 32 6z" fill="#4F7A3A" />
    <path d="M32 12c-6 0-9 8-10 14-1 5-5 9-5 17 0 8 7 12 15 12s15-4 15-12c0-8-4-12-5-17-1-6-4-14-10-14z" fill="#CFE39A" />
    <circle cx="32" cy="41" r="9" fill="#9A6A3E" /><circle cx="29" cy="38" r="2.5" fill="#B98A5C" />
  </>,
  banana: <>
    <path d="M10 20c4 22 22 34 44 30 2 0 2-3 0-4-18 2-32-10-37-28-1-3-6-2-7 2z" fill="#F2CF5B" />
    <path d="M14 22c5 18 18 28 36 27" stroke="#D9AE35" strokeWidth="2" fill="none" /><path d="M8 18l3-5 4 3-2 4z" fill="#7A5A2E" /><path d="M53 46l5 1-1 4-5-1z" fill="#7A5A2E" />
  </>,
  choclo: <>
    <ellipse cx="32" cy="30" rx="11" ry="22" fill="#F2CF5B" />
    <g fill="#E0B43C"><circle cx="27" cy="16" r="2.2" /><circle cx="33" cy="14" r="2.2" /><circle cx="37" cy="20" r="2.2" /><circle cx="27" cy="24" r="2.2" /><circle cx="33" cy="26" r="2.2" /><circle cx="38" cy="31" r="2.2" /><circle cx="26" cy="33" r="2.2" /><circle cx="32" cy="38" r="2.2" /></g>
    <path d="M32 60c-10-6-16-18-16-30 4 8 10 16 16 20z" fill="#7FB38A" /><path d="M32 60c10-6 16-18 16-30-4 8-10 16-16 20z" fill="#5E9A6A" />
  </>,
  berenjena: <>
    <path d="M36 14c10 2 16 14 14 28-2 12-12 18-22 16S12 46 16 34c3-9 8-12 10-16 2-3 5-5 10-4z" fill="#6B4A8A" />
    <path d="M40 20c6 4 8 12 7 20" stroke="#8C6BAE" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M28 16c2-6 10-8 16-4-4 0-6 2-6 4 4 0 7 2 8 5-6-2-12-2-18-5z" fill="#6E9F5D" /><path d="M38 12l4-7" stroke="#6E9F5D" strokeWidth="3" strokeLinecap="round" />
  </>,
  anco: <>
    <path d="M28 6c6 0 8 6 8 12 0 5 3 8 8 13 6 6 8 12 6 18-3 8-12 11-20 10-9-1-15-7-15-14 0-6 4-10 7-14 3-3 3-6 2-11-1-7 0-14 4-14z" fill="#E7B77A" />
    <path d="M30 28c-2 8 0 16 6 22" stroke="#D49B57" strokeWidth="2" fill="none" /><path d="M26 6l2-4 3 1-1 4z" fill="#7A5A2E" />
  </>,
  melon: <>
    <circle cx="32" cy="34" r="22" fill="#C9C98A" />
    <g stroke="#A8A866" strokeWidth="1.6" fill="none"><path d="M14 26c10 6 26 6 36 0M12 36c12 6 28 6 40 0M16 46c10 4 22 4 32 0M26 13c-4 12-4 30 0 42M38 13c4 12 4 30 0 42" /></g>
    <path d="M32 12l2-5" stroke="#7A5A2E" strokeWidth="3" strokeLinecap="round" />
  </>,
  sandia: <>
    <ellipse cx="32" cy="34" rx="25" ry="20" fill="#3F7A4A" />
    <g stroke="#6FAE6E" strokeWidth="4" fill="none" strokeLinecap="round"><path d="M18 18c-4 10-4 22 2 32M28 14c-3 12-3 28 0 40M38 14c3 12 3 28 0 40M48 18c4 10 4 22-2 32" /></g>
  </>,
};

export function Fruta({ id, size = 40 }: { id: FruitId; size?: number }) {
  return <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">{P[id]}</svg>;
}
