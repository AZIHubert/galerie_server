import { ValidationError } from 'joi';
import { FIELD_HAS_SPACES, FIELD_IS_PASSWORD } from '@src/helpers/errorMessages';

export default (errors: ValidationError) => {
  const normalizeErrors: {[key:string]: string} = {};
  errors.details.forEach((e) => {
    if (e.message.includes('pattern')) {
      if (e.message.includes('passwordError')) {
        normalizeErrors[e.path[0]] = FIELD_IS_PASSWORD;
      } else if (e.message.includes('spacesError')) {
        normalizeErrors[e.path[0]] = FIELD_HAS_SPACES;
      } else {
        normalizeErrors[e.path[0]] = e.message;
      }
    } else {
      normalizeErrors[e.path[0]] = e.message;
    }
  });
  return normalizeErrors;
};
