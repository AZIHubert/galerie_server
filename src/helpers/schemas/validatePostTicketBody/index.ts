import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

interface TicketI {
  header: string;
}

const BODY_MAX_LENGTH = 200;
const BODY_MIN_LENGTH = 10;
const HEADER_MAX_LENGTH = 30;
const HEADER_MIN_LENGTH = 5;

const ticketSchema = Joi.object({
  body: Joi.string()
    .trim()
    .required()
    .empty()
    .max(BODY_MAX_LENGTH)
    .min(BODY_MIN_LENGTH)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
      'string.max': FIELD_MAX_LENGTH(BODY_MAX_LENGTH),
      'string.min': FIELD_MIN_LENGTH(BODY_MIN_LENGTH),
    }),
  header: Joi.string()
    .trim()
    .required()
    .empty()
    .max(HEADER_MAX_LENGTH)
    .min(HEADER_MIN_LENGTH)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
      'string.max': FIELD_MAX_LENGTH(HEADER_MAX_LENGTH),
      'string.min': FIELD_MIN_LENGTH(HEADER_MIN_LENGTH),
    }),
});

export default (ticket: TicketI) => ticketSchema
  .validate(ticket, options);
