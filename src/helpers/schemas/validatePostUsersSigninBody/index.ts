import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  FIELD_SHOULD_MATCH,
} from '@src/helpers/errorMessages';
import {
  SPECIAL_CHARS_ERROR,
  PASSWORD_ERROR,
  SPACES_ERROR,
} from '@root/src/helpers/patternErrorsName';

import options from '../options';

const PASSWORD_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const USERNAME_MAX_LENGTH = 30;
const USERNAME_MIN_LENGTH = 3;

const userSignInSchema = Joi.object({
  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': FIELD_SHOULD_MATCH('password'),
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .lowercase()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.email': FIELD_SHOULD_BE_AN_EMAIL,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
    }),
  password: Joi.string()
    .required()
    .empty()
    .pattern(new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{0,}$/), {
      name: PASSWORD_ERROR,
    })
    .pattern(new RegExp(/^\S*$/), { name: SPACES_ERROR })
    .min(PASSWORD_MIN_LENGTH)
    .max(PASSWORD_MAX_LENGTH)
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
  userName: Joi.string()
    .trim()
    .pattern(new RegExp(/^\S*$/), { name: SPACES_ERROR })
    .pattern(new RegExp(/^\S*$/), { name: SPACES_ERROR })
    .pattern(new RegExp(/^[^#?!@$%^&*-.]*$/), {
      name: SPECIAL_CHARS_ERROR,
    })
    .empty()
    .min(USERNAME_MIN_LENGTH)
    .max(USERNAME_MAX_LENGTH)
    .required()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
      'string.max': FIELD_MAX_LENGTH(USERNAME_MAX_LENGTH),
      'string.min': FIELD_MIN_LENGTH(USERNAME_MIN_LENGTH),
      'string.required': FIELD_IS_REQUIRED,
    }),
});

export default (user: any) => userSignInSchema
  .validate(user, options);
