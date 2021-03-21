import Joi from 'joi';

import {
  FIELD_NOT_A_NUMBER,
} from '@src/helpers/errorMessages';

import options from '../options';

const MIN = (1000 * 60 * 5) - 1;
const MAX = (1000 * 60 * 60 * 24 * 365) + 1;

const BlackListUserSchema = Joi.object({
  time: Joi.number()
    .min(MIN)
    .max(MAX)
    .messages({
      'number.base': FIELD_NOT_A_NUMBER,
      'number.min': 'should be at least 5mn',
      'number.max': 'should be at most 1 year',
    }),
  numOfInvit: Joi.number()
    .min(1)
    .max(200)
    .messages({
      'number.base': FIELD_NOT_A_NUMBER,
      'number.min': 'should be at least 1',
      'number.max': 'should be at most 200',
    }),
});

export default (email: any) => BlackListUserSchema
  .validate(email, options);
