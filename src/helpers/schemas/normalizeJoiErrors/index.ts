import { ValidationError } from 'joi';
import {
  FIELD_HAS_SPACES,
  FIELD_IS_PASSWORD,
} from '@src/helpers/errorMessages';

export default (errors: ValidationError) => {
  const normalizeErrors: {[key:string]: string} = {};

  errors.details.forEach((error) => {
    if (error.message.includes('pattern')) {
      if (error.message.includes('passwordError')) {
        normalizeErrors[error.path[0]] = FIELD_IS_PASSWORD;
      } else if (error.message.includes('spacesError')) {
        normalizeErrors[error.path[0]] = FIELD_HAS_SPACES;
      } else {
        normalizeErrors[error.path[0]] = error.message;
      }
    } else {
      normalizeErrors[error.path[0]] = error.message;
    }
  });
  return normalizeErrors;
};
