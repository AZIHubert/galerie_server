import Joi from 'joi';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const userLogInSchema = Joi.object({
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
    }),
  userNameOrEmail: Joi.string()
    .trim()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
    }),
});

export default (user: any) => userLogInSchema
  .validate(user, options);
