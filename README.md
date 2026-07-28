# Cerchia — guida di avvio (fase 1: account veri)

Questa è la prima versione "vera" di Cerchia: l'accesso e la registrazione
ora creano account reali e persistenti, salvati su un database gratuito
(Supabase). Il resto dell'app (cerchie, missioni, punteggi) per ora usa
ancora dati di prova: li collegheremo al database nella fase successiva.

Non serve sapere programmare per seguire questi passaggi: sono tutti click
su siti web, tranne un paio di comandi da copiare e incollare in un
terminale.

---

## 1. Installa Node.js (una volta sola)

Node.js è il programma che serve per far girare il progetto sul tuo
computer prima di pubblicarlo online.

1. Vai su **https://nodejs.org**
2. Scarica la versione **LTS** (quella consigliata, non "Current")
3. Installala come un programma qualsiasi (Avanti, Avanti, Fine)
4. Per verificare che sia andato tutto bene, apri il Terminale (Mac) o
   Prompt dei comandi/PowerShell (Windows) e scrivi:
   ```
   node --version
   ```
   Deve rispondere con qualcosa tipo `v20.x.x`.

## 2. Apri il progetto e installa le dipendenze

Estrai la cartella `cerchia-app` che ti ho dato, poi nel terminale:

```bash
cd percorso/della/cartella/cerchia-app
npm install
```

Questo scarica tutte le librerie necessarie (React, Supabase, ecc.). Ci
vuole un minuto, va fatto una sola volta.

## 3. Crea il database gratuito su Supabase

1. Vai su **https://supabase.com** e clicca **"Start your project"**
2. Registrati (con email o GitHub)
3. Clicca **"New project"**
   - Dai un nome, es. `cerchia`
   - Crea una **password del database**: salvala da qualche parte sicura
     (un gestore password, o anche solo un file di testo protetto) — non
     è la password che useranno i tuoi amici nell'app, serve solo a te
   - Scegli una regione vicina a te (es. **Europe West (Frankfurt)** se
     sei in Italia)
   - Clicca **"Create new project"** e aspetta 1-2 minuti che sia pronto

## 4. Crea le tabelle del database

1. Nel progetto Supabase, apri **"SQL Editor"** dal menu a sinistra
2. Apri il file `supabase/schema.sql` che trovi in questo progetto
3. Copia tutto il contenuto e incollalo nell'editor SQL su Supabase
4. Clicca **"Run"**

Se va tutto bene vedrai un messaggio di successo. Questo crea la tabella
che conterrà gli account e i profili dei tuoi amici.

## 5. Disattiva la conferma email

Cerchia usa il numero di telefono, non l'email — ma dietro le quinte si
appoggia al sistema email di Supabase (è spiegato bene nel file
`src/supabaseClient.js`, se sei curioso). Per farlo funzionare senza
inviare vere email di conferma:

1. Vai su **Authentication > Providers** (o **Sign In / Providers** a
   seconda della versione dell'interfaccia)
2. Apri **Email**
3. Disattiva **"Confirm email"**
4. Salva

## 6. Collega il progetto alle tue chiavi Supabase

1. Nel progetto Supabase vai su **Project Settings > API**
2. Copia il valore di **Project URL**
3. Copia il valore di **anon public** (è una chiave lunga)
4. Nella cartella del progetto, fai una copia del file `.env.example` e
   rinominala in `.env`
5. Apri `.env` e incolla i due valori al posto dei segnaposto

Il file `.env` non va mai condiviso pubblicamente (è già escluso da Git
tramite `.gitignore`): contiene le chiavi del tuo progetto.

## 7. Prova l'app sul tuo computer

```bash
npm run dev
```

Il terminale mostrerà un indirizzo tipo `http://localhost:5173` — aprilo
nel browser. Prova a registrarti con un numero di telefono finto e una
password. Poi vai sulla dashboard di Supabase, sezione **Authentication**
e **Table Editor > profiles**: dovresti vedere il tuo account comparire
davvero. Se lo vedi, ha funzionato tutto!

## 8. Pubblicala online (per usarla dal telefono con gli amici)

Il modo più semplice, gratuito, è **Vercel**:

1. Vai su **https://vercel.com** e registrati (puoi farlo con GitHub)
2. Se non hai già un account **GitHub**, creane uno su
   **https://github.com** — è dove "vive" il codice online
3. Carica la cartella del progetto su un nuovo repository GitHub (se non
   hai mai usato Git, la pagina di GitHub stessa spiega come fare
   l'upload direttamente dal browser, senza terminale)
4. Su Vercel, clicca **"Add New… > Project"**, scegli il repository
   appena creato
5. Prima di confermare il deploy, aggiungi le **Environment Variables**:
   stessi due valori del tuo file `.env` (`VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`)
6. Clicca **Deploy**

Dopo un minuto avrai un link tipo `https://cerchia-tuonome.vercel.app`:
mandalo ai tuoi amici. Sul telefono, aprendolo da Chrome o Safari, potranno
usare "Aggiungi a schermata Home" per farlo comparire come un'app vera,
senza passare da nessuno store.

---

## Cosa manca ancora (prossimi passaggi)

- Collegare **cerchie, missioni e punteggi** al database vero (oggi sono
  ancora dati di prova locali) così tutti i membri di un gruppo vedono
  davvero gli stessi dati aggiornati in tempo reale
- Se in futuro vorrai una vera verifica del numero di telefono via SMS,
  si collega un provider (es. Twilio) direttamente dalle impostazioni di
  Supabase Authentication — comporta un piccolo costo per SMS inviato
- Eventuale pubblicazione sugli store ufficiali (facoltativa): si può
  fare più avanti con Expo, una volta che l'app funziona bene come sito
