import Joi from 'joi';

import {
  FIELD_NOT_A_STRING,
  FIELD_NOT_A_NUMBER,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MIN_LENGTH_OF_TEN,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
} from '@src/helpers/errorMessages';

import options from '../options';

const MIN = (1000 * 60 * 10) - 1;
const MAX = (1000 * 60 * 60 * 24 * 365) + 1;

const BlackListUserSchema = Joi.object({
  reason: Joi.string()
    .required()
    .min(10)
    .max(200)
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.min': FIELD_MIN_LENGTH_OF_TEN,
      'string.max': FIELD_MAX_LENGTH_TWO_HUNDRER,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  time: Joi.number()
    .min(MIN)
    .max(MAX)
    .messages({
      'number.base': FIELD_NOT_A_NUMBER,
      'number.min': 'should be ban at least 10mn',
      'number.max': 'should be ban at most 1 year',
    }),
});

export default (email: any) => BlackListUserSchema
  .validate(email, options);