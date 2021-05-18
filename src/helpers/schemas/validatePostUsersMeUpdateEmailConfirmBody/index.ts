import Joi from 'joi';

import {
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

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
      'string.base': FIELD_NOT_A_STRING,
      'string.email': FIELD_IS_EMAIL,
      'string.empty': FIELD_IS_EMPTY,
    }),
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.empty': FIELD_IS_EMPTY,
    }),
});

export default (email: any) => sendUpdateNewEmailSchema.validate(email, options);
