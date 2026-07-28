import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Mancano VITE_SUPABASE_URL e/o VITE_SUPABASE_ANON_KEY. ' +
    'Copia il file .env.example in .env e inserisci i valori del tuo progetto Supabase ' +
    '(li trovi in Project Settings > API).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ------------------------------------------------------------------ */
/* Perché una "email tecnica"?                                         */
/* ------------------------------------------------------------------ */
// Supabase Auth nella sua forma più semplice (senza costi aggiuntivi)
// autentica le persone con email + password. L'autenticazione via SMS
// esiste, ma richiede di collegare e PAGARE un provider esterno (Twilio
// o simili) per ogni codice inviato.
//
// Per Cerchia l'utente deve poter usare il numero di telefono come
// identificativo, senza costi né configurazioni aggiuntive: quindi
// trasformiamo il numero in una email "tecnica" interna, mai mostrata
// nell'interfaccia, e usiamo quella per parlare con Supabase Auth.
// L'utente vede e digita solo il proprio numero di telefono.
//
// Nota bene: questo significa che NON verifichiamo che il numero
// inserito appartenga davvero a chi si registra (niente OTP via SMS).
// Per un'app privata tra amici va benissimo; se in futuro vorrai
// aggiungere una vera verifica via SMS, si può collegare un provider
// direttamente nelle impostazioni di Supabase Auth.
export function phoneToTechnicalEmail(phone) {
  const digits = phone.replace(/[^0-9]/g, '');
  return `${digits}@phone.cerchia.local`;
}

export function normalizePhone(phone) {
  return phone.replace(/[^0-9+]/g, '');
}
