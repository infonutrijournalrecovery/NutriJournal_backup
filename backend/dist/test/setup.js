"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Configurazione globale per i test
(0, globals_1.beforeAll)(() => {
    // Setup variabili d'ambiente per i test
    process.env['REDIS_URL'] = 'redis://localhost:6379';
    process.env['EDAMAM_APP_ID'] = 'test-app-id';
    process.env['EDAMAM_APP_KEY'] = 'test-app-key';
});
// Pulisci il mock delle variabili d'ambiente dopo ogni test
(0, globals_1.afterEach)(() => {
    globals_1.jest.resetModules();
    globals_1.jest.clearAllMocks();
});
// Pulisci tutto dopo tutti i test
(0, globals_1.afterAll)(() => {
    globals_1.jest.clearAllMocks();
});
