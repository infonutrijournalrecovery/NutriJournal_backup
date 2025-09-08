/**
 * Middleware di validazione
 */
const validate = (schema) => {
    return (req, res, next) => {
        try {
            // Per ora passa sempre la validazione
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    validate
};
