# 📧 Configurazione Email per NutriJournal

Questa guida ti aiuterà a configurare il servizio email per il recupero password di NutriJournal.

## 🔧 Configurazione Gmail (Raccomandato)

### Passaggio 1: Abilita l'autenticazione a 2 fattori
1. Vai su [myaccount.google.com](https://myaccount.google.com)
2. Clicca su "Sicurezza" nel menu di sinistra
3. Sotto "Accesso a Google", abilita la "Verifica in 2 passaggi"

### Passaggio 2: Genera una password per app
1. Dopo aver abilitato la 2FA, vai di nuovo su "Sicurezza"
2. Sotto "Accesso a Google", clicca su "Password per le app"
3. Seleziona "App" → "Altro (nome personalizzato)"
4. Inserisci "NutriJournal Backend" come nome
5. Copia la password generata (16 caratteri)

### Passaggio 3: Configura il file .env
Modifica il file `.env` nella root del backend con i tuoi dati:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuoemail@gmail.com
SMTP_PASS=password_per_app_di_16_caratteri
FROM_EMAIL=noreply@nutrijournal.app
FROM_NAME=NutriJournal
```

## 🔧 Configurazione Outlook/Hotmail

```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tuoemail@outlook.com
SMTP_PASS=tua_password_outlook
FROM_EMAIL=noreply@nutrijournal.app
FROM_NAME=NutriJournal
```

## 🔧 Configurazione Yahoo Mail

```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=tuoemail@yahoo.com
SMTP_PASS=tua_password_specifica_app_yahoo
FROM_EMAIL=noreply@nutrijournal.app
FROM_NAME=NutriJournal
```

## 🔧 Configurazione Provider Personalizzato

Se usi un provider email personalizzato (come il tuo dominio):

```bash
SMTP_HOST=mail.tuodominio.com
SMTP_PORT=587
SMTP_USER=noreply@tuodominio.com
SMTP_PASS=password_del_tuo_account
FROM_EMAIL=noreply@tuodominio.com
FROM_NAME=NutriJournal
```

## 🧪 Test della Configurazione

Dopo aver configurato l'email, riavvia il server:

```bash
cd backend
node src/server.js
```

Se vedi il messaggio:
```
✅ Configurazione email inizializzata correttamente
```

La configurazione è corretta! Se invece vedi:
```
⚠️ Configurazione email non completa. Reset password disabilitato.
```

Controlla che tutte le variabili email siano impostate nel file `.env`.

## 🔒 Sicurezza

- **Mai committare** il file `.env` nel repository
- Usa password specifiche per app, non la tua password principale
- Cambia le password regolarmente
- In produzione, usa servizi dedicati come SendGrid o AWS SES

## 🚀 Email di Reset Password

Una volta configurato, il sistema invierà automaticamente email per il reset password con:
- Link di reset sicuro con token temporaneo
- Design responsive e professionale
- Scadenza automatica del token (1 ora)
- Template in italiano

## 🆘 Risoluzione Problemi

### Errore "Authentication failed"
- Verifica che la password per app sia corretta
- Assicurati che la 2FA sia abilitata su Gmail

### Errore "Connection timeout"
- Controlla l'host SMTP e la porta
- Verifica la connessione internet

### Email non ricevute
- Controlla la cartella SPAM
- Verifica che l'indirizzo FROM_EMAIL sia valido
- Controlla i log del server per errori
