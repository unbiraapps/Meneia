// Página web del link "olvidé mi contraseña" (mail de Supabase). No toca datos de salud.
import { createClient } from '@supabase/supabase-js';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('f'), p1 = $<HTMLInputElement>('p1'), p2 = $<HTMLInputElement>('p2'), msg = $('m'), btn = $<HTMLButtonElement>('b');
const say = (t: string, kind: 'bad' | 'ok' | '' = '') => { msg.textContent = t; msg.className = 'msg ' + kind; };

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  say('Esta página todavía no está configurada. Escribinos a contacto@unbiraapps.com.', 'bad');
  btn.disabled = true;
} else {
  const sb = createClient(url, anon, { auth: { detectSessionInUrl: true, persistSession: false } });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (p1.value.length < 8) return say('Tiene que tener al menos 8 caracteres.', 'bad');
    if (p1.value !== p2.value) return say('Las contraseñas no coinciden.', 'bad');
    btn.disabled = true; say('Guardando…');
    const { data } = await sb.auth.getSession();
    if (!data.session) { btn.disabled = false; return say('El link venció o ya se usó. Pedí uno nuevo desde la app.', 'bad'); }
    const { error } = await sb.auth.updateUser({ password: p1.value });
    if (error) { btn.disabled = false; return say('No se pudo guardar. Probá de nuevo.', 'bad'); }
    form.reset(); say('Listo. Ya podés volver a la app y entrar con tu contraseña nueva.', 'ok');
  });
}
