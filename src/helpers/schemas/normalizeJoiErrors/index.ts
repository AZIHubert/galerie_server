import { ValidationError } from 'joi';
import {
  FIELD_CANNOT_CONTAIN_SPACES,
  FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
  FIELD_SHOULD_BE_A_PASSWORD,
} from '#src/helpers/errorMessages';
import {
  SPECIAL_CHARS_ERROR,
  PASSWORD_ERROR,
  SPACES_ERROR,
} from '#src/helpers/patternErrorsName';

export default (errors: ValidationError) => {
  const normalizeErrors: {[key:string]: string} = {};

  errors.details.forEach((error) => {
    if (error.message.includes('pattern')) {
      if (error.message.includes(PASSWORD_ERROR)) {
        normalizeErrors[error.path[0]] = FIELD_SHOULD_BE_A_PASSWORD;
      } else if (error.message.includes(SPACES_ERROR)) {
        normalizeErrors[error.path[0]] = FIELD_CANNOT_CONTAIN_SPACES;
      } else if (SPECIAL_CHARS_ERROR) {
        normalizeErrors[error.path[0]] = FIELD_CANNOT_CONTAIN_SPECIAL_CHARS;
      } else {
        normalizeErrors[error.path[0]] = error.message;
      }
    } else {
      normalizeErrors[error.path[0]] = error.message;
    }
  });
  return normalizeErrors;
};
