import Joi from 'joi';

import {
  FIELD_NOT_A_STRING,
  FIELD_IS_EMPTY,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_THREE,
} from '@src/helpers/errorMessages';

import options from '../options';

const galerieSchema = Joi.object({
  name: Joi.string()
    .trim()
    .empty()
    .min(3)
    .max(30)
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.min': FIELD_MIN_LENGTH_OF_THREE,
      'string.max': FIELD_MAX_LENGTH_THRITY,
      'string.empty': FIELD_IS_EMPTY,
    }),
});

export default (galerie: {
  name: string;
}) => galerieSchema
  .validate(galerie, options);
