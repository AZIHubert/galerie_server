import { ValidationError } from 'joi';

export default (errors: ValidationError) => {
  const normalizeErrors: {[key:string]: string} = {};
  errors.details.forEach((e) => {
    normalizeErrors[e.path[0]] = e.message;
  });
  return normalizeErrors;
};
