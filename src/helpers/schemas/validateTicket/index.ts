import Joi from 'joi';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_MIN_LENGTH_OF_TEN,
  FIELD_MIN_LENGTH_OF_FIVE,
  FIELD_NOT_A_STRING,
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
    .max(30)
    .min(5)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.min': FIELD_MIN_LENGTH_OF_FIVE,
    }),
  body: Joi.string()
    .trim()
    .required()
    .empty()
    .max(200)
    .min(10)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_TWO_HUNDRER,
      'string.min': FIELD_MIN_LENGTH_OF_TEN,
    }),
});

export default (ticket: TicketI) => ticketSchema
  .validate(ticket, options);
