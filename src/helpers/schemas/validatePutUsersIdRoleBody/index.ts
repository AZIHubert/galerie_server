import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
} from '#src/helpers/errorMessages';

import options from '../options';

const resetPasswordSchema = Joi.object({
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
  role: Joi.string()
    .required()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
    }),
});

export default (email: any) => resetPasswordSchema
  .validate(email, options);
