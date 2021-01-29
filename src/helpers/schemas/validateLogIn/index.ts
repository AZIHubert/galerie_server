import Joi from 'joi';

import {
  FIELD_NOT_A_STRING,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
} from '@src/helpers/errorMessages';

import options from '../options';

const userLogInSchema = Joi.object({
  userNameOrEmail: Joi.string()
    .trim()
    .required()
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
});

export default (user: any) => userLogInSchema
  .validate(user, options);
