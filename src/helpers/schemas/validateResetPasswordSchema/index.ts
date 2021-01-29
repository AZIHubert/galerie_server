import Joi from 'joi';

import {
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
} from '@src/helpers/errorMessages';

import options from '../options';

const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .messages({
      'string.email': FIELD_IS_EMAIL,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
});

export default (email: any) => resetPasswordSchema
  .validate(email, options);
