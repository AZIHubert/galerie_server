import Joi from 'joi';

import {
  FIELD_NOT_A_STRING,
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
} from '@src/helpers/errorMessages';

import options from '../options';

const sendUpdateNewEmailSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2 })
    .required()
    .lowercase()
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.email': FIELD_IS_EMAIL,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
});

export default (email: any) => sendUpdateNewEmailSchema.validate(email, options);
