import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_NUMBER,
  FIELD_SHOULD_BE_A_STRING,
} from '#src/helpers/errorMessages';

import options from '../options';

const MAX = (1000 * 60 * 60 * 24 * 365);
const MIN = (1000 * 60 * 10);
const REASON_MAX_LENGTH = 200;
const REASON_MIN_LENGTH = 10;

const BlackListUserSchema = Joi.object({
  reason: Joi.string()
    .trim()
    .required()
    .empty()
    .min(REASON_MIN_LENGTH)
    .max(REASON_MAX_LENGTH)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
      'string.max': FIELD_MAX_LENGTH(REASON_MAX_LENGTH),
      'string.min': FIELD_MIN_LENGTH(REASON_MIN_LENGTH),
    }),
  time: Joi.number()
    .min(MIN)
    .max(MAX)
    .messages({
      'number.base': FIELD_SHOULD_BE_A_NUMBER,
      'number.max': 'should be ban at most 1 year',
      'number.min': 'should be ban at least 10 minutes',
    }),
});

export default (email: any) => BlackListUserSchema
  .validate(email, options);
