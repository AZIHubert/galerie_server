import Joi from 'joi';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_THREE,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const galerieSchema = Joi.object({
  name: Joi.string()
    .trim()
    .empty()
    .min(3)
    .max(30)
    .required()
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.min': FIELD_MIN_LENGTH_OF_THREE,
    }),
});

export default (galerie: {
  name: string;
}) => galerieSchema
  .validate(galerie, options);
