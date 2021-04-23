import Joi from 'joi';

import {
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_EMPTY,
  FIELD_IS_PASSWORD,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const sendUpdatePassword = Joi.object({
  confirmNewPassword: Joi.string()
    .required()
    .valid(Joi.ref('newPassword'))
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
    }),
  currentPassword: Joi.string()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.empty': FIELD_IS_EMPTY,
    }),
  newPassword: Joi.string()
    .required()
    .pattern(
      new RegExp(/^\S*$/),
      { name: 'spacesError' },
    )
    .pattern(
      new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'),
      { name: 'passwordError' },
    )
    .max(30)
    .min(8)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.min': FIELD_MIN_LENGTH_OF_HEIGH,
      'string.pattern.base': FIELD_IS_PASSWORD,
    }),
});

export default (password: any) => sendUpdatePassword
  .validate(password, options);
