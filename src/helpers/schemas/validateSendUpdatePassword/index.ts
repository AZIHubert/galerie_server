import Joi from 'joi';

import {
  FIELD_NOT_A_STRING,
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_EMPTY,
  FIELD_IS_PASSWORD,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
} from '@src/helpers/errorMessages';

import options from '../options';

const sendUpdatePassword = Joi.object({
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  updatedPassword: Joi.string()
    .required()
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'))
    .min(8)
    .max(30)
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
      'string.min': FIELD_MIN_LENGTH_OF_HEIGH,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.pattern.base': FIELD_IS_PASSWORD,
    }),
  confirmUpdatedPassword: Joi.string()
    .required()
    .valid(Joi.ref('updatedPassword'))
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
    }),
});

export default (password: any) => sendUpdatePassword.validate(password, options);
