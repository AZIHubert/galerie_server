import Joi from 'joi';

import {
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
} from '#src/helpers/errorMessages';

import options from '../options';

const DESCRIPTION_MAX_LENGTH = 200;

const galerieSchema = Joi.object({
  description: Joi.string()
    .required()
    .allow('')
    .trim()
    .max(DESCRIPTION_MAX_LENGTH)
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'string.base': FIELD_SHOULD_BE_A_STRING,
      'string.max': FIELD_MAX_LENGTH(DESCRIPTION_MAX_LENGTH),
    }),
});

export default (galerie: {
  name: string;
}) => galerieSchema
  .validate(galerie, options);
