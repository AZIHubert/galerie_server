import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
} from '#src/helpers/errorMessages';

import options from '../options';

const BlackListUserSchema = Joi.object({
  code: Joi.string()
    .required()
    .empty()
    .trim()
    .lowercase()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
});

export default (email: any) => BlackListUserSchema
  .validate(email, options);
