import './styles.css';
import {
  analyze, dayKinds, upcomingReminders, addDays, daysBetween, toDate, iso, localToday, plural,
  fmtShort, fmtLong, MONTHS_LONG, type Analysis, type Period, type PillEvent, type Flow, type PillType, type ReminderSettings,
} from './calc';
import {
  db, getReminders, setSetting, getSetting, savePeriod, savePillEvent, exportBackup, parseBackup, restoreBackup,
  migrateFromPrototype, type Backup,
} from './db';
import { isNative, permissionState, requestPermission, syncReminders, notifyNow } from './notify';

// ---------- Datos de ejemplo (solo se muestran, nunca se guardan) ----------
const SAMPLE_PERIODS: Period[] = [
  { start: '2026-06-03', end: '2026-06-07', flow: 'Normal', note: '' },
  { start: '2026-07-01', end: '2026-07-05', flow: 'Normal', note: '' },
  { start: '2026-07-30', end: '2026-08-03', flow: 'Abundante', note: 'Cólicos fuertes el 1er día' },
  { start: '2026-08-27', end: '2026-08-31', flow: 'Normal', note: '' },
  { start: '2026-10-01', end: '2026-10-07', flow: 'Abundante', note: 'Más largo de lo normal' },
  { start: '2026-10-29', end: '2026-11-02', flow: 'Normal', note: '' },
];
const SAMPLE_EVENTS: PillEvent[] = [{ date: '2026-08-20', type: 'stop' }];

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

let TODAY = localToday();
const now0 = new Date();
let viewY = now0.getFullYear(), viewM = now0.getMonth();

interface State { periods: Period[]; events: PillEvent[]; example: boolean; reminders: ReminderSettings; migrated: boolean }
let S: State;
let A: Analysis;
let editingId: number | null = null;
let pendingDel: string | null = null;

async function load(): Promise<void> {
  const migrated = await migrateFromPrototype().catch(() => false);
  const [periods, events, reminders, hideExample] = await Promise.all([
    db.periods.toArray(), db.events.toArray(), getReminders(), getSetting('hideExample', false),
  ]);
  const empty = !periods.length && !events.length;
  const example = empty && !hideExample;
  S = { periods: example ? SAMPLE_PERIODS : periods, events: example ? SAMPLE_EVENTS : events, example, reminders, migrated };
  A = analyze(S.periods, S.events, TODAY);
}

async function refresh(): Promise<void> {
  TODAY = localToday();
  await load();
  render();
  if (!S.example) {
    syncReminders(upcomingReminders(A, S.reminders, new Date())).catch(() => {});
  }
}

// ---------- Render ----------

function render(): void {
  $('today').textContent = 'Hoy: ' + fmtLong(TODAY);
  renderAlerts();
  renderHero();
  renderCal();
  renderHist();
  renderSettings();
}

function renderAlerts(): void {
  const al: string[] = [];
  if (S.example) {
    al.push(`<div class="alert info"><span class="dot"></span><div><b>Estos son datos de ejemplo.</b> Cuando anotes tu primer período desaparecen y quedan solo los tuyos.</div><button class="ghost" id="hideEx">Ocultar</button></div>`);
  }
  if (S.migrated) al.push(`<div class="alert ok"><span class="dot"></span><div><b>Listo:</b> pasamos tus registros de la versión anterior.</div></div>`);
  const last = A.last;
  if (last) {
    const prev = A.rows[A.rows.length - 2];
    if (prev) prev.flags.filter(f => !f.text.startsWith('Sangrado')).forEach(f => al.push(`<div class="alert ${f.level === 'alert' ? 'alert-r' : 'warn'}"><span class="dot"></span><div><b>Cambio en tu último ciclo:</b> ${f.text} (${fmtShort(prev.start)} → ${fmtShort(last.start)}, ${prev.cycle} días).</div></div>`));
    last.flags.filter(f => f.text.startsWith('Sangrado')).forEach(f => al.push(`<div class="alert ${f.level === 'alert' ? 'alert-r' : 'warn'}"><span class="dot"></span><div><b>Último período:</b> ${f.text}.</div></div>`));
    if (A.late > 0 && A.next) al.push(`<div class="alert alert-r"><span class="dot"></span><div><b>Atraso de ${plural(A.late, 'día', 'días')}</b> respecto de la fecha estimada (${fmtShort(A.next)}).</div></div>`);
    if (last.end === '' && daysBetween(last.start, TODAY) >= 1 && !S.example) {
      al.push(`<div class="alert info"><span class="dot"></span><div>Tu período del ${fmtShort(last.start)} sigue en curso. Cuando termine, anotá el último día.</div><button class="ghost" data-edit="${last.id}">Anotar fin</button></div>`);
    }
  }
  $('alerts').innerHTML = al.join('');
  const he = document.getElementById('hideEx');
  if (he) he.onclick = async () => { await setSetting('hideExample', true); await refresh(); toast('Listo, ya podés cargar tus períodos'); };
  $('alerts').querySelectorAll<HTMLButtonElement>('[data-edit]').forEach(b => b.onclick = () => startEdit(Number(b.dataset.edit)));
}

function renderHero(): void {
  if (A.next) {
    $('nextDate').textContent = cap(fmtLong(A.next));
    const d = daysBetween(TODAY, A.next);
    $('nextIn').textContent = d > 0 ? `En ${plural(d, 'día', 'días')} · rango probable ${fmtShort(addDays(A.next, -2))} – ${fmtShort(addDays(A.next, 2))}`
      : d === 0 ? 'Podría llegar hoy' : `Debía llegar hace ${plural(-d, 'día', 'días')}`;
    $('ovu').textContent = A.ovu ? fmtShort(A.ovu) : 'No aplica';
    $('fert').textContent = A.fertile ? `${fmtShort(A.fertile[0])}–${fmtShort(A.fertile[1])}` : 'Con pastillas';
    $('avg').textContent = `${A.avgCycle} días`;
  } else {
    $('nextDate').textContent = 'Sin datos';
    $('nextIn').textContent = 'Anotá al menos un período para estimar.';
    ['ovu', 'fert', 'avg'].forEach(id => ($(id).textContent = '—'));
  }
}

function renderCal(): void {
  const kinds = dayKinds(A, S.events);
  $('monthLbl').textContent = `${MONTHS_LONG[viewM]} ${viewY}`;
  const first = new Date(Date.UTC(viewY, viewM, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const start = iso(new Date(first.getTime() - offset * 864e5));
  const names: Record<string, string> = { period: 'período', pred: 'período probable', fertile: 'fértil', ovu: 'ovulación', pill: 'cambio de pastillas' };
  let h = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<div class="dow" aria-hidden="true">${d}</div>`).join('');
  for (let i = 0; i < 42; i++) {
    const s = addDays(start, i), d = toDate(s);
    if (i === 35 && d.getUTCMonth() !== viewM) break;
    const k = kinds.get(s) ?? new Set();
    let c = 'day';
    if (d.getUTCMonth() !== viewM) c += ' out';
    if (k.has('period')) c += ' period';
    else if (k.has('ovu')) c += ' ovu';
    else if (k.has('pred')) c += ' pred';
    else if (k.has('fertile')) c += ' fertile';
    if (k.has('pill')) c += ' pill';
    if (s === TODAY) c += ' today';
    const lab = [...k].map(x => names[x]).join(', ');
    h += `<div class="${c}" title="${fmtLong(s)}${lab ? ' · ' + lab : ''}" aria-label="${fmtLong(s)}${lab ? ', ' + lab : ''}">${d.getUTCDate()}</div>`;
  }
  $('cal').innerHTML = h;
}

function renderHist(): void {
  $('fumDate').textContent = A.last ? fmtLong(A.last.start) : 'Sin datos';
  const ev = A.lastPill;
  $('pillStatus').hidden = !ev;
  if (ev) {
    const d = daysBetween(ev.date, TODAY);
    const after = A.rows.filter(r => r.start > ev.date).length;
    $('pillText').innerHTML = `<b>${ev.type === 'stop' ? 'Dejaste las pastillas el' : 'Tomás pastillas desde el'} ${fmtLong(ev.date)}</b><br><span class="muted">Hace ${plural(d, 'día', 'días')} · ${plural(after, 'período', 'períodos')} desde entonces</span>`;
  }

  type Item = { d: string; r?: (typeof A.rows)[number]; e?: PillEvent };
  const items: Item[] = [...A.rows.map((r): Item => ({ d: r.start, r })), ...S.events.map((e): Item => ({ d: e.date, e }))]
    .sort((a, b) => (a.d === b.d ? (a.e ? -1 : 1) : a.d < b.d ? 1 : -1));
  $('count').textContent = plural(A.rows.length, 'período', 'períodos');
  if (!items.length) {
    $('hist').innerHTML = '<li style="grid-template-columns:1fr;border:none"><div class="empty">Todavía no hay nada anotado. Cargá tu primer período en <b>Anotar período</b> y la app empieza a estimar tus fechas.</div></li>';
    return;
  }
  const delBtn = (key: string) => S.example ? '' : `<button class="op${pendingDel === key ? ' sure' : ''}" data-del="${key}">${pendingDel === key ? '¿Borrar?' : 'Borrar'}</button>`;
  $('hist').innerHTML = items.map(({ r, e }) => e ? `
    <li class="ev">
      <span class="bar"></span>
      <div style="min-width:0">
        <div class="when num">${fmtShort(e.date)} · ${e.type === 'stop' ? 'Dejaste las pastillas anticonceptivas' : 'Empezaste las pastillas anticonceptivas'}</div>
        <div class="meta">${e.type === 'stop' ? 'Los ciclos siguientes pueden tardar unos meses en regularizarse' : 'Mientras tomás pastillas, la ovulación estimada no aplica'}</div>
      </div>
      <div class="ops">${delBtn('e:' + e.date)}</div>
    </li>` : `
    <li>
      <span class="bar"></span>
      <div style="min-width:0">
        <div class="when num">${fmtShort(r!.start)}${r!.end ? ' – ' + fmtShort(r!.end) : ' · en curso'}</div>
        <div class="meta num">${r!.dur ? plural(r!.dur, 'día', 'días') + ' de sangrado' : 'Sin fecha de fin'} · ${r!.flow}${r!.cycle ? ` · ciclo de ${r!.cycle} días` : ' · ciclo actual'}</div>
        ${r!.note ? `<div class="note">${esc(r!.note)}</div>` : ''}
        ${r!.flags.length ? `<div class="flags">${r!.flags.map(f => `<span class="flag ${f.level}">${f.text}</span>`).join('')}</div>` : ''}
      </div>
      <div class="ops">${S.example ? '' : `<button class="op" data-edit="${r!.id}">Editar</button>`}${delBtn('p:' + r!.start)}</div>
    </li>`).join('');

  $('hist').querySelectorAll<HTMLButtonElement>('[data-edit]').forEach(b => b.onclick = () => startEdit(Number(b.dataset.edit)));
  $('hist').querySelectorAll<HTMLButtonElement>('[data-del]').forEach(b => b.onclick = async () => {
    const k = b.dataset.del!;
    if (pendingDel !== k) { pendingDel = k; renderHist(); return; }
    pendingDel = null;
    const [t, d] = k.split(':');
    if (t === 'p') await db.periods.where('start').equals(d).delete();
    else await db.events.where('date').equals(d).delete();
    if (editingId != null && !(await db.periods.get(editingId))) cancelEdit();
    await refresh();
    toast('Registro borrado');
  });
}

// ---------- Formulario ----------

const pillRadios = () => document.querySelectorAll<HTMLInputElement>('input[name=pill]');
const checkedVal = (name: string) => (document.querySelector<HTMLInputElement>(`input[name=${name}]:checked`)?.value ?? '');

pillRadios().forEach(r => r.addEventListener('change', () => {
  const v = checkedVal('pill');
  $('pillDateWrap').hidden = !v;
  const pd = $<HTMLInputElement>('fPillDate');
  if (v && !pd.value) pd.value = $<HTMLInputElement>('fStart').value || TODAY;
}));

function resetForm(): void {
  $<HTMLFormElement>('form').reset();
  $<HTMLInputElement>('flNormal').checked = true;
  $<HTMLInputElement>('plNone').checked = true;
  $('pillDateWrap').hidden = true;
  $('fErr').hidden = true;
  [$<HTMLInputElement>('fStart'), $<HTMLInputElement>('fEnd'), $<HTMLInputElement>('fPillDate')].forEach(i => (i.max = TODAY));
}

async function startEdit(id: number): Promise<void> {
  const p = await db.periods.get(id);
  if (!p) return;
  editingId = id;
  resetForm();
  $<HTMLInputElement>('fStart').value = p.start;
  $<HTMLInputElement>('fEnd').value = p.end;
  (document.querySelector<HTMLInputElement>(`input[name=flow][value="${p.flow}"]`) ?? $<HTMLInputElement>('flNormal')).checked = true;
  $<HTMLTextAreaElement>('fNote').value = p.note;
  $('formTitle').textContent = 'Editar período';
  $('editingTag').hidden = false;
  $('fSubmit').textContent = 'Guardar cambios';
  $('fCancel').hidden = false;
  $('pillField').hidden = true;
  $('formBlock').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  if (!p.end) $<HTMLInputElement>('fEnd').focus();
}

function cancelEdit(): void {
  editingId = null;
  resetForm();
  $('formTitle').textContent = 'Anotar período';
  $('editingTag').hidden = true;
  $('fSubmit').textContent = 'Guardar período';
  $('fCancel').hidden = true;
  $('pillField').hidden = false;
}
$('fCancel').onclick = cancelEdit;

$<HTMLFormElement>('form').addEventListener('submit', async e => {
  e.preventDefault();
  const start = $<HTMLInputElement>('fStart').value, end = $<HTMLInputElement>('fEnd').value;
  const pill = (editingId == null ? checkedVal('pill') : '') as PillType | '';
  const pillDate = $<HTMLInputElement>('fPillDate').value;
  const fail = (t: string) => { $('fErr').textContent = t; $('fErr').hidden = false; };
  if (!start && !pill) return fail('Elegí el primer día del período.');
  if (pill && !pillDate) return fail('Elegí la fecha en que dejaste o empezaste las pastillas.');
  if (pill && pillDate > TODAY) return fail('La fecha de las pastillas no puede ser futura.');
  if (start && end && end < start) return fail('El último día no puede ser antes del primero.');
  if (start && start > TODAY) return fail('El primer día no puede ser una fecha futura.');
  if (start && end && daysBetween(start, end) > 20) return fail('Un período de más de 20 días parece un error. Revisá las fechas.');
  $('fErr').hidden = true;

  const wasExample = S.example;
  const flagsBefore = new Set(A.rows.flatMap(r => r.flags.map(f => r.start + f.text)));
  let msg = editingId != null ? 'Cambios guardados' : start ? 'Período guardado' : 'Cambio de pastillas guardado';
  try {
    if (start) await savePeriod({ ...(editingId != null ? { id: editingId } : {}), start, end, flow: (checkedVal('flow') || 'Normal') as Flow, note: $<HTMLTextAreaElement>('fNote').value.trim() });
    if (pill) { await savePillEvent({ date: pillDate, type: pill }); if (start) msg += ' y el cambio de pastillas'; }
  } catch {
    return fail('No se pudo guardar. Probá de nuevo.');
  }
  if (wasExample) msg += '. Se ocultaron los datos de ejemplo';
  cancelEdit();
  const d = toDate(start || pillDate); viewY = d.getUTCFullYear(); viewM = d.getUTCMonth();
  await refresh();

  // Aviso si apareció un cambio nuevo en la duración del ciclo
  if (!wasExample) {
    const fresh = A.rows.flatMap(r => r.flags.filter(f => !flagsBefore.has(r.start + f.text)).map(f => f.text));
    if (fresh.length) {
      msg += ' · ojo: ' + fresh[0].toLowerCase();
      notifyNow('Cambio en tu ciclo', fresh.join(' · ')).catch(() => {});
    }
  }
  toast(msg);
});

$('prevM').onclick = () => { viewM--; if (viewM < 0) { viewM = 11; viewY--; } renderCal(); };
$('nextM').onclick = () => { viewM++; if (viewM > 11) { viewM = 0; viewY++; } renderCal(); };

// ---------- Avisos ----------

const hourSel = $<HTMLSelectElement>('sHour');
for (let h = 6; h <= 22; h++) hourSel.insertAdjacentHTML('beforeend', `<option value="${h}">${String(h).padStart(2, '0')}:00</option>`);

async function renderSettings(): Promise<void> {
  const r = S.reminders;
  $<HTMLInputElement>('sPeriod').checked = r.periodOn;
  $<HTMLSelectElement>('sDays').value = String(r.periodDaysBefore);
  $<HTMLSelectElement>('sDays').disabled = !r.periodOn;
  $<HTMLInputElement>('sFertile').checked = r.fertileOn;
  $<HTMLInputElement>('sOvu').checked = r.ovuOn;
  $<HTMLInputElement>('sLate').checked = r.lateOn;
  hourSel.value = String(r.hour);

  const note = $('notifNote');
  if (!isNative()) {
    note.innerHTML = 'En esta versión los avisos aparecen arriba de todo cuando abrís la app. Con la <b>app de Android</b> te llegan como notificación aunque esté cerrada.';
    return;
  }
  const st = await permissionState();
  if (st === 'granted') {
    const list = upcomingReminders(A, r, new Date());
    note.innerHTML = list.length ? `Notificaciones activadas. Próximo aviso: <b>${fmtLong(list[0].date)}</b> a las ${String(r.hour).padStart(2, '0')}:00.` : 'Notificaciones activadas. Anotá tus períodos para programar los avisos.';
  } else {
    note.innerHTML = `Para recibir avisos, permití las notificaciones. <button class="ghost" id="askPerm" type="button" style="margin-top:6px">Permitir notificaciones</button>`;
    $('askPerm').onclick = async () => {
      const res = await requestPermission();
      if (res === 'granted') { await refresh(); toast('Notificaciones activadas'); }
      else toast('Activalas desde Ajustes del teléfono > Apps > Mi Ciclo');
    };
  }
}

async function saveSettings(): Promise<void> {
  const r: ReminderSettings = {
    periodOn: $<HTMLInputElement>('sPeriod').checked,
    periodDaysBefore: Number($<HTMLSelectElement>('sDays').value),
    fertileOn: $<HTMLInputElement>('sFertile').checked,
    ovuOn: $<HTMLInputElement>('sOvu').checked,
    lateOn: $<HTMLInputElement>('sLate').checked,
    hour: Number(hourSel.value),
  };
  await setSetting('reminders', r);
  await refresh();
  toast('Avisos actualizados');
}
['sPeriod', 'sDays', 'sFertile', 'sOvu', 'sLate', 'sHour'].forEach(id => $(id).addEventListener('change', saveSettings));

// ---------- Copia de seguridad ----------

const backupText = async () => JSON.stringify(await exportBackup(), null, 1);

$('bCopy').onclick = async () => {
  if (S.example) return toast('Todavía no cargaste datos propios');
  const t = await backupText();
  try { await navigator.clipboard.writeText(t); toast('Copiado. Pegalo en tus notas o en un chat con vos misma'); }
  catch {
    const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Copiado'); } catch { toast('No se pudo copiar'); }
    ta.remove();
  }
};

$('bDownload').onclick = async () => {
  if (S.example) return toast('Todavía no cargaste datos propios');
  const t = await backupText();
  const name = `mi-ciclo-copia-${TODAY}.json`;
  if (isNative()) {
    // En Android usamos compartir para guardarlo en Drive, WhatsApp, etc.
    try {
      const { Share } = await import('./share');
      await Share(name, t);
      return;
    } catch { /* sigue con descarga */ }
  }
  const url = URL.createObjectURL(new Blob([t], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Si no se descargó, usá “Copiar mis datos”');
};

let pendingRestore: Backup | null = null;
const resetRestore = () => { pendingRestore = null; $('rConfirm').hidden = true; $('rErr').hidden = true; $('bRestore').textContent = 'Revisar copia'; };
$('bRestoreOpen').onclick = () => { $('restoreBox').hidden = !$('restoreBox').hidden; resetRestore(); };
$('bRestoreCancel').onclick = () => { $('restoreBox').hidden = true; $<HTMLTextAreaElement>('rText').value = ''; $<HTMLInputElement>('rFile').value = ''; resetRestore(); };
$('rText').addEventListener('input', resetRestore);
$<HTMLInputElement>('rFile').addEventListener('change', async ev => {
  const f = (ev.target as HTMLInputElement).files?.[0];
  if (f) { $<HTMLTextAreaElement>('rText').value = await f.text(); resetRestore(); }
});
$('bRestore').onclick = async () => {
  if (pendingRestore) {
    await restoreBackup(pendingRestore);
    $('bRestoreCancel').click();
    await refresh();
    toast('Copia restaurada');
    return;
  }
  const parsed = parseBackup($<HTMLTextAreaElement>('rText').value.trim());
  if (!parsed.ok) { $('rErr').textContent = parsed.error; $('rErr').hidden = false; return; }
  pendingRestore = parsed.data;
  const current = S.example ? 0 : S.periods.length;
  $('rConfirmTxt').innerHTML = `La copia tiene <b>${plural(parsed.data.periods.length, 'período', 'períodos')}</b> y ${plural(parsed.data.events.length, 'cambio', 'cambios')} de pastillas.${current ? ` Va a reemplazar los ${current} que tenés ahora.` : ''}`;
  $('rConfirm').hidden = false;
  $('bRestore').textContent = 'Sí, restaurar';
};

// ---------- Utilidades ----------

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(m: string): void {
  document.querySelectorAll('.toast').forEach(x => x.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m;
  document.body.appendChild(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2800);
}

// Al volver a la app (por ejemplo al día siguiente) se recalcula todo
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && localToday() !== TODAY) refresh(); });

resetForm();
refresh().catch(err => {
  console.error(err);
  $('alerts').innerHTML = '<div class="alert alert-r"><span class="dot"></span><div><b>No se pudieron leer tus datos.</b> Cerrá y volvé a abrir la app. Si sigue pasando, puede que el navegador esté en modo privado.</div></div>';
});
