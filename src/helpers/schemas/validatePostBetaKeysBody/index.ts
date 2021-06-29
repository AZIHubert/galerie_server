import Joi from 'joi';

import {
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
} from '#src/helpers/errorMessages';

import options from '../options';

const postUsersMeUpdateEmailConfirmBodySchema = Joi.object({
  email: Joi.string()
    .allow('')
    .trim()
    .lowercase()
    .email({ minDomainSegments: 2 })
    .messages({
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.email': FIELD_SHOULD_BE_AN_EMAIL,
    }),
});

export default (body: any) => postUsersMeUpdateEmailConfirmBodySchema
  .validate(body, options);
