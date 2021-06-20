import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_MATCH,
} from '@src/helpers/errorMessages';
import {
  PASSWORD_ERROR,
  SPACES_ERROR,
} from '@root/src/helpers/patternErrorsName';

import options from '../options';

const NEW_PASSWORD_MAX_LENGTH = 30;
const NEW_PASSWORD_MIN_LENGTH = 8;

const sendUpdatePassword = Joi.object({
  confirmNewPassword: Joi.string()
    .required()
    .empty()
    .valid(Joi.ref('newPassword'))
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'any.only': FIELD_SHOULD_MATCH('password'),
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
  currentPassword: Joi.string()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
  newPassword: Joi.string()
    .required()
    .empty()
    .pattern(new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{0,}$/), {
      name: PASSWORD_ERROR,
    })
    .pattern(new RegExp(/^\S*$/), { name: SPACES_ERROR })
    .max(NEW_PASSWORD_MAX_LENGTH)
    .min(NEW_PASSWORD_MIN_LENGTH)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
      'string.max': FIELD_MAX_LENGTH(NEW_PASSWORD_MAX_LENGTH),
      'string.min': FIELD_MIN_LENGTH(NEW_PASSWORD_MIN_LENGTH),
    }),
});

export default (password: any) => sendUpdatePassword
  .validate(password, options);
