import Joi from 'joi';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const deleteGalerieIdSchema = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
    }),
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
    }),
});

export default (galerie: {
  name: string;
  password: string;
}) => deleteGalerieIdSchema
  .validate(galerie, options);
