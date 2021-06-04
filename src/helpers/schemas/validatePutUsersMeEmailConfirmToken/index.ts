import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  WRONG_TOKEN,
} from '@src/helpers/errorMessages';

import options from '../options';

const userLogInSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .lowercase()
    .messages({
      'any.required': `${WRONG_TOKEN}: email ${FIELD_IS_REQUIRED}`,
      'string.base': `${WRONG_TOKEN}: email ${FIELD_SHOULD_BE_A_STRING}`,
      'string.email': `${WRONG_TOKEN}: email ${FIELD_SHOULD_BE_AN_EMAIL}`,
      'string.empty': `${WRONG_TOKEN}: email ${FIELD_CANNOT_BE_EMPTY}`,
    }),
});

export default (user: any) => userLogInSchema
  .validate(user, options);
