import Joi from 'joi';

// Helper to reject emails and require a dot in the hostname
const notEmail = (value: string, helpers: any) => {
  // Reject if it looks like an email
  if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
    return helpers.error('any.invalidEmail');
  }
  // Parse the URL and check for a dot in the hostname
  try {
    const url = new URL(value);
    if (!url.hostname.includes('.')) {
      return helpers.error('any.invalidDomain');
    }
  } catch {
    return helpers.error('string.uri');
  }
  return value;
};

export const createUrlSchema = Joi.object({
  longUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .custom(notEmail)
    .messages({
      'string.uri': 'Original URL must be a valid HTTP/HTTPS URL.',
      'string.empty': 'Original URL is required.',
      'any.required': 'Original URL is required.',
      'any.invalidEmail': 'Emails are not allowed. Please enter a valid URL.',
      'any.invalidDomain': 'Please enter a valid URL with a valid domain.',
    }),
});