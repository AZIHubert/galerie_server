import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
} from '#src/helpers/errorMessages';

import options from '../options';

const sendUpdateNewEmailSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.email': FIELD_SHOULD_BE_AN_EMAIL,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
});

export default (email: any) => sendUpdateNewEmailSchema.validate(email, options);
