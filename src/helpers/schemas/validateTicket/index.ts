import Joi from 'joi';

import {
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_MIN_LENGTH_OF_TEN,
  FIELD_MIN_LENGTH_OF_FIVE,
  FIELD_NOT_A_STRING,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
} from '@src/helpers/errorMessages';

import options from '../options';

interface TicketI {
  header: string;
}

const ticketSchema = Joi.object({
  header: Joi.string()
    .trim()
    .required()
    .empty()
    .min(5)
    .max(30)
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.min': FIELD_MIN_LENGTH_OF_FIVE,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  body: Joi.string()
    .trim()
    .required()
    .empty()
    .min(10)
    .max(200)
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'any.required': FIELD_IS_REQUIRED,
      'string.empty': FIELD_IS_EMPTY,
      'string.min': FIELD_MIN_LENGTH_OF_TEN,
      'string.max': FIELD_MAX_LENGTH_TWO_HUNDRER,
    }),
});

export default (ticket: TicketI) => ticketSchema
  .validate(ticket, options);
