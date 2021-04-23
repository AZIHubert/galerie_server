import Joi from 'joi';

import { FIELD_NOT_A_NUMBER } from '@src/helpers/errorMessages';

import options from '../options';

const MAX = (1000 * 60 * 60 * 24 * 365) + 1;
const MIN = (1000 * 60 * 5) - 1;

const BlackListUserSchema = Joi.object({
  numOfInvit: Joi.number()
    .max(200)
    .min(1)
    .messages({
      'number.base': FIELD_NOT_A_NUMBER,
      'number.max': 'should be at most 200',
      'number.min': 'should be at least 1',
    }),
  time: Joi.number()
    .max(MAX)
    .min(MIN)
    .messages({
      'number.base': FIELD_NOT_A_NUMBER,
      'number.max': 'should be at most 1 year',
      'number.min': 'should be at least 5mn',
    }),
});

export default (email: any) => BlackListUserSchema
  .validate(email, options);
