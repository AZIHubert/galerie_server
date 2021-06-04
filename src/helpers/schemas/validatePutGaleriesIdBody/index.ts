import Joi from 'joi';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
} from '@src/helpers/errorMessages';

import options from '../options';

const DESCRIPTION_MAX_LENGTH = 200;
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 30;

const galerieSchema = Joi.object({
  description: Joi.string()
    .allow('')
    .trim()
    .max(DESCRIPTION_MAX_LENGTH)
    .messages({
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.max': FIELD_MAX_LENGTH(DESCRIPTION_MAX_LENGTH),
    }),
  name: Joi.string()
    .trim()
    .empty()
    .min(NAME_MIN_LENGTH)
    .max(NAME_MAX_LENGTH)
    .messages({
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.empty': FIELD_CANNOT_BE_EMPTY,
      'string.max': FIELD_MAX_LENGTH(NAME_MAX_LENGTH),
      'string.min': FIELD_MIN_LENGTH(NAME_MIN_LENGTH),
    }),
});

export default (galerie: {
  name: string;
}) => galerieSchema
  .validate(galerie, options);
