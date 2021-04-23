import Joi from 'joi';

import {
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const modifyPasswordSchema = Joi.object({
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
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
    .min(8)
    .max(30)
    // Minimum 9 chars.
    // Maximum 30 chars.
    // At least one uppercase letter.
    // At least one lowercase letter.
    // At least one number.
    // At least one special char.
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.min': FIELD_MIN_LENGTH_OF_HEIGH,
    }),
});

export default (passwords: any) => modifyPasswordSchema
  .validate(passwords, options);
