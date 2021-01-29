import Joi from 'joi';

import {
  FIELD_NOT_A_STRING,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
} from '@src/helpers/errorMessages';

import options from '../options';

const sendUpdateEmailSchema = Joi.object({
  password: Joi.string()
    .trim()
    .required()
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
});

export default (password: any) => sendUpdateEmailSchema
  .validate(password, options);
