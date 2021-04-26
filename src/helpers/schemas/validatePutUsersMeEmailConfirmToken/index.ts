import Joi from 'joi';

import {
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
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
      'string.base': `${WRONG_TOKEN}: email ${FIELD_NOT_A_STRING}`,
      'string.email': `${WRONG_TOKEN}: email ${FIELD_IS_EMAIL}`,
      'string.empty': `${WRONG_TOKEN}: email ${FIELD_IS_EMPTY}`,
    }),
});

export default (user: any) => userLogInSchema
  .validate(user, options);
