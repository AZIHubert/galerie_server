import Joi from 'joi';

import { FIELD_SHOULD_BE_A_NUMBER } from '@src/helpers/errorMessages';

import options from '../options';

const MAX_NUM_OF_INVIT = 200;
const MIN_NUM_OF_INVIT = 1;
const MAX_TIME = (1000 * 60 * 60 * 24 * 365);
const MIN_TIME = (1000 * 60 * 5);

const BlackListUserSchema = Joi.object({
  numOfInvits: Joi.number()
    .max(MAX_NUM_OF_INVIT)
    .min(MIN_NUM_OF_INVIT)
    .messages({
      'number.base': FIELD_SHOULD_BE_A_NUMBER,
      'number.max': 'should be at most 200',
      'number.min': 'should be at least 1',
    }),
  time: Joi.number()
    .max(MAX_TIME)
    .min(MIN_TIME)
    .messages({
      'number.base': FIELD_SHOULD_BE_A_NUMBER,
      'number.max': 'should be at most 1 year',
      'number.min': 'should be at least 5mn',
    }),
});

export default (email: any) => BlackListUserSchema
  .validate(email, options);
