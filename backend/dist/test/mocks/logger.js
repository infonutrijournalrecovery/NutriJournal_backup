"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class MockLogger {
    info(message, meta) {
        // noop
    }
    warn(message, meta) {
        // noop
    }
    error(message, meta) {
        // noop
    }
    debug(message, meta) {
        // noop
    }
}
exports.logger = new MockLogger();
