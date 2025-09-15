INDICAZIONI:
-collegare tutto al backend, appena la GUI è finita
-calendario data di nascita in register non funzionante



-correggere le routes

-le progress bar non sono ottimizzate per layout desktop e non sono presenti nel layout mobile
-rimuovi le quick stats nell'header e inseriamo lì un button per il profilo utente
-rimuovi la sezione azioni rapide dalla dashboard
-rinomina la sezione "Pasti recenti" in "Gestione pasti" e crea 4 sezioni principali disposti orizzontalmente dentro Gestione pasti(Colazione, Pranzo, Spuntino, Cena) decora con qualche icona carina e aggiungi un button "+" per ogni sezione pasto.
-vorrei che ogni pasto principale nella sezione gestione pasti avesse delle piccole progress bar che indicano la quantità di calorie e macronutrienti assorbiti nel pasto in relazione ai cibi/prodotti registrati in quel pasto. Questo richiede anche l'implementazione di un ulteriore calcolo per consigliare la migliore suddivisione delle calorie e macronutrienti in ogni pasto giornaliero.


-file api.service.ts sistemato

-ottimizzazione lunghezza pagine(creazione di un sistema di variabili css globali):
--css dashboard fatto
--css scanner fatto
--import inutili rimossi in entrambi

- MODERNIZZAZIONE SASS - MIGRAZIONE @import → @use per rimuovere i warnings in fase di build


creazione pagine nuove:
profilo utente con allergie e sensbilità(aspetto da migliorare)
cambio password(OK)
modifica dati personali
visualizzazione obiettivi con ricalcolo automatico
registrazione pasti

ottimizzazione di view-goals
