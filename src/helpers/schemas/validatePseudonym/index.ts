import Joi from 'joi';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_THREE,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const userSignInSchema = Joi.object({
  pseudonym: Joi.string()
    .trim()
    .empty()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.min': FIELD_MIN_LENGTH_OF_THREE,
      'string.required': FIELD_IS_REQUIRED,
    }),
});

export default (user: any) => userSignInSchema
  .validate(user, options);
