/**
 * Creates an Express middleware that validates req.body against a Zod schema.
 * Usage: router.post('/route', validate(myZodSchema), controller.handler)
 */
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    next(error); // Caught by errorHandler (ZodError)
  }
};

module.exports = validate;
