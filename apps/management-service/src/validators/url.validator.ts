import Joi from 'joi';

export const createUrlSchema = Joi.object({
  longUrl: Joi.string().uri({ scheme: ['http', 'https'] }).required().messages({
    'string.uri': 'Original URL must be a valid HTTP/HTTPS URL.',
    'string.empty': 'Original URL is required.',
    'any.required': 'Original URL is required.',
  }),
});