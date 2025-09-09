import Joi from 'joi';

// Custom URI validator that's more lenient with encoded characters
const flexibleUri = (value: string, helpers: any) => {
  // Reject if it looks like an email
  if (/^[^@]+@[^@]+\.[^@]+$/.test(value)) {
    return helpers.error('any.invalidEmail');
  }
  
  try {
    // Try to create a URL object - this handles most valid URLs including encoded ones
    const url = new URL(value);
    
    // Check for valid scheme
    if (!['http:', 'https:'].includes(url.protocol)) {
      return helpers.error('any.invalidScheme');
    }
    
    // Check for a dot in the hostname
    if (!url.hostname.includes('.')) {
      return helpers.error('any.invalidDomain');
    }
    
    return value;
  } catch {
    return helpers.error('string.uri');
  }
};

export const createUrlSchema = Joi.object({
  longUrl: Joi.string()
    .required()
    .custom(flexibleUri)
    .messages({
      'string.uri': 'Original URL must be a valid HTTP/HTTPS URL.',
      'string.empty': 'Original URL is required.',
      'any.required': 'Original URL is required.',
      'any.invalidEmail': 'Emails are not allowed. Please enter a valid URL.',
      'any.invalidDomain': 'Please enter a valid URL with a valid domain.',
      'any.invalidScheme': 'URL must use HTTP or HTTPS protocol.',
    }),
});
