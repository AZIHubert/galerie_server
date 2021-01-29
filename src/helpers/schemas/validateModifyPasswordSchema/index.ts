import Joi from 'joi';

import {
  FIELD_NOT_A_STRING,
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
} from '@src/helpers/errorMessages';

import options from '../options';

const modifyPasswordSchema = Joi.object({
  password: Joi.string()
    .required()
    .empty()
    .pattern(new RegExp(/^\S*$/), { name: 'spacesError' })
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'), { name: 'passwordError' })
    .min(8)
    .max(30)
    // Minimum 9 chars.
    // Maximum 30 chars.
    // At least one uppercase letter.
    // At least one lowercase letter.
    // At least one number.
    // At least one special char.
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'any.required': FIELD_IS_REQUIRED,
      'string.empty': FIELD_IS_EMPTY,
      'string.min': FIELD_MIN_LENGTH_OF_HEIGH,
      'string.max': FIELD_MAX_LENGTH_THRITY,
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
      'string.empty': FIELD_IS_EMPTY,
    }),
});

export default (passwords: any) => modifyPasswordSchema
  .validate(passwords, options);
