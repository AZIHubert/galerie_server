import Joi from 'joi';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_MIN_LENGTH_OF_TEN,
  FIELD_NOT_A_STRING,
  FIELD_NOT_A_NUMBER,
} from '@src/helpers/errorMessages';

import options from '../options';

const MAX = (1000 * 60 * 60 * 24 * 365);
const MIN = (1000 * 60 * 10);

const BlackListUserSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .required()
    .empty()
    .min(10)
    .max(200)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_TWO_HUNDRER,
      'string.min': FIELD_MIN_LENGTH_OF_TEN,
    }),
  time: Joi.number()
    .min(MIN)
    .max(MAX)
    .messages({
      'number.base': FIELD_NOT_A_NUMBER,
      'number.max': 'should be ban at most 1 year',
      'number.min': 'should be ban at least 10 minutes',
    }),
});

export default (email: any) => BlackListUserSchema
  .validate(email, options);
