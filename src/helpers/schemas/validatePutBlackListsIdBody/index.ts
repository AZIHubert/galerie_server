import Joi from 'joi';

import { FIELD_SHOULD_BE_A_NUMBER } from '@src/helpers/errorMessages';

import options from '../options';

const MAX = (1000 * 60 * 60 * 24 * 365);
const MIN = (1000 * 60 * 10);

const BlackListUserSchema = Joi.object({
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
