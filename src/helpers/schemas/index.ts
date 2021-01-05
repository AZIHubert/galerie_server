import Joi from 'joi';

interface UserSignIn {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface UserLogIn {
  userNameOrEmail: string;
  password: string;
}

const userSignInSchema = Joi.object({
  userName: Joi.string()
    .alphanum()
    .empty()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': 'should be a type of \'text\'',
      'string.alphanum': 'cannot contain spaces',
      'string.min': 'should have a minimum length of {#limit}',
      'string.max': 'should have a maximum length of {#limit}',
      'string.empty': 'cannot be an empty field',
      'string.required': 'is required',
    }),
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .messages({
      'string.email': 'should be a valid email',
      'string.empty': 'cannot be an empty field',
      'any.required': 'is required',
    }),
  password: Joi.string()
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'))
    .min(8)
    .max(30)
  // Minimum 9 chars.
  // Maximum 30 chars.
  // At least one uppercase letter.
  // At least one lowercase letter.
  // At least one number.
  // At least one special char.
    .messages({
      'string.empty': 'cannot be an empty field',
      'string.min': 'should have a minimum length of {#limit}',
      'string.max': 'should have a maximum length of {#limit}',
      'string.pattern.base': 'need at least on lowercase, one uppercase, one number and one special char',
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .messages({
      'string.base': 'should be a type of \'text\'',
      'any.only': 'must match password',
      'string.empty': 'cannot be an empty field',
    }),
});

const userLogInSchema = Joi.object({
  userNameOrEmail: Joi.string()
    .required()
    .empty()
    .messages({
      'string.base': 'should be a type of \'text\'',
      'string.empty': 'cannot be an empty field',
      'any.required': 'is required',
    }),
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'string.base': 'should be a type of \'text\'',
      'string.empty': 'cannot be an empty field',
      'any.required': 'is required',
    }),
});

const options: Joi.ValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
};

export const validateSignIn = (user: UserSignIn) => userSignInSchema.validate(user, options);
export const validateLogIn = (user: UserLogIn) => userLogInSchema.validate(user, options);
export const normalizeJoiErrors = (errors: Joi.ValidationError) => {
  const normalizeErrors: {[key:string]: string} = {};
  errors.details.forEach((e) => {
    normalizeErrors[e.path[0]] = e.message;
  });
  return normalizeErrors;
};
