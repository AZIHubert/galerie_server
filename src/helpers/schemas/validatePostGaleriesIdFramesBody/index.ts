import Joi from 'joi';

import {
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const galerieSchema = Joi.object({
  description: Joi.string()
    .allow('')
    .trim()
    .max(200)
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.max': FIELD_MAX_LENGTH_TWO_HUNDRER,
    }),
});

export default (galerie: {
  name: string;
}) => galerieSchema
  .validate(galerie, options);
