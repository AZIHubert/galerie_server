import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_MATCH,
} from '@src/helpers/errorMessages';

import options from '../options';

const PASSWORD_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;

const modifyPasswordSchema = Joi.object({
  confirmPassword: Joi.string()
    .required()
    .empty()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': FIELD_SHOULD_MATCH('password'),
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
  password: Joi.string()
    .required()
    .empty()
    .pattern(
      new RegExp(/^\S*$/),
      { name: 'spacesError' },
    )
    .pattern(
      new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'),
      { name: 'passwordError' },
    )
    .max(PASSWORD_MAX_LENGTH)
    .min(PASSWORD_MIN_LENGTH)
    // Minimum 9 chars.
    // Maximum 30 chars.
    // At least one uppercase letter.
    // At least one lowercase letter.
    // At least one number.
    // At least one special char.
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
      'string.max': FIELD_MAX_LENGTH(PASSWORD_MAX_LENGTH),
      'string.min': FIELD_MIN_LENGTH(PASSWORD_MIN_LENGTH),
    }),
});

export default (passwords: any) => modifyPasswordSchema
  .validate(passwords, options);
