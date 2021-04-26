import Joi from 'joi';

import {
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
  FIELD_MIN_LENGTH_OF_THREE,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const userSignInSchema = Joi.object({
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
    }),
  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .lowercase()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.email': FIELD_IS_EMAIL,
      'string.empty': FIELD_IS_EMPTY,
    }),
  password: Joi.string()
    .required()
    .empty()
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'), { name: 'passwordError' })
    .pattern(new RegExp(/^\S*$/), { name: 'spacesError' })
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
  userName: Joi.string()
    .trim()
    .pattern(new RegExp(/^\S*$/), { name: 'spacesError' })
    .empty()
    .min(3)
    .max(30)
    .required()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.min': FIELD_MIN_LENGTH_OF_THREE,
      'string.required': FIELD_IS_REQUIRED,
    }),
});

export default (user: any) => userSignInSchema
  .validate(user, options);
