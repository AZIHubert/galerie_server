import Joi from 'joi';

import {
  FIELD_NOT_A_STRING,
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_THREE,
  FIELD_MIN_LENGTH_OF_HEIGH,
} from '@src/helpers/errorMessages';

import options from '../options';

const userSignInSchema = Joi.object({
  userName: Joi.string()
    .trim()
    .pattern(new RegExp(/^\S*$/), { name: 'spacesError' })
    .empty()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.min': FIELD_MIN_LENGTH_OF_THREE,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.empty': FIELD_IS_EMPTY,
      'string.required': FIELD_IS_REQUIRED,
    }),
  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .messages({
      'string.email': FIELD_IS_EMAIL,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  password: Joi.string()
    .trim()
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
      'string.empty': FIELD_IS_EMPTY,
      'string.min': FIELD_MIN_LENGTH_OF_HEIGH,
      'string.max': FIELD_MAX_LENGTH_THRITY,
    }),
  confirmPassword: Joi.string()
    .trim()
    .valid(Joi.ref('password'))
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
      'string.empty': FIELD_IS_EMPTY,
    }),
});

export default (user: any) => userSignInSchema
  .validate(user, options);
