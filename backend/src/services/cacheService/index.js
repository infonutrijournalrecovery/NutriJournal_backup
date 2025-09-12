
// Versione senza Redis: tutti i metodi sono "no-op" (non fanno nulla)
class CacheService {
    async get(key) {
        return null;
    }
    async set(key, value, expirationInSeconds = 3600) {
        // nessuna operazione
    }
    async del(key) {
        // nessuna operazione
    }
}

module.exports = { cacheService: new CacheService() };
