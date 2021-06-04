import { ValidationError } from 'joi';
import {
  FIELD_CANNOT_CONTAIN_SPACES,
  FIELD_SHOULD_BE_A_PASSWORD,
} from '@src/helpers/errorMessages';

export default (errors: ValidationError) => {
  const normalizeErrors: {[key:string]: string} = {};

  errors.details.forEach((error) => {
    if (error.message.includes('pattern')) {
      if (error.message.includes('passwordError')) {
        normalizeErrors[error.path[0]] = FIELD_SHOULD_BE_A_PASSWORD;
      } else if (error.message.includes('spacesError')) {
        normalizeErrors[error.path[0]] = FIELD_CANNOT_CONTAIN_SPACES;
      } else {
        normalizeErrors[error.path[0]] = error.message;
      }
    } else {
      normalizeErrors[error.path[0]] = error.message;
    }
  });
  return normalizeErrors;
};
