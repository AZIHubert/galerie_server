import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const PSEUDONYM_MAX_LENGTH = 30;
const PSEUDONYM_MIN_LENGTH = 3;

const userSignInSchema = Joi.object({
  pseudonym: Joi.string()
    .trim()
    .empty()
    .min(PSEUDONYM_MIN_LENGTH)
    .max(PSEUDONYM_MAX_LENGTH)
    .required()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
      'string.max': FIELD_MAX_LENGTH(PSEUDONYM_MAX_LENGTH),
      'string.min': FIELD_MIN_LENGTH(PSEUDONYM_MIN_LENGTH),
    }),
});

export default (user: any) => userSignInSchema
  .validate(user, options);
