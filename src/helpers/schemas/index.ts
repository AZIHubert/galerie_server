import Joi from 'joi';

import {
  FIELD_HAS_SPACES,
  FIELD_NOT_A_STRING,
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_PASSWORD,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
} from '../errorMessages';

const userSignInSchema = Joi.object({
  userName: Joi.string()
    .alphanum()
    .empty()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.alphanum': FIELD_HAS_SPACES,
      'string.min': FIELD_MIN_LENGTH,
      'string.max': FIELD_MAX_LENGTH,
      'string.empty': FIELD_IS_EMPTY,
      'string.required': FIELD_IS_REQUIRED,
    }),
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .messages({
      'string.email': FIELD_IS_EMAIL,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  password: Joi.string()
    .required()
    .empty()
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
      'any.required': FIELD_IS_REQUIRED,
      'string.empty': FIELD_IS_EMPTY,
      'string.min': FIELD_MIN_LENGTH,
      'string.max': FIELD_MAX_LENGTH,
      'string.pattern.base': FIELD_IS_PASSWORD,
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
      'string.empty': FIELD_IS_EMPTY,
    }),
});

const userLogInSchema = Joi.object({
  userNameOrEmail: Joi.string()
    .required()
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .messages({
      'string.email': FIELD_IS_EMAIL,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
});

const modifyPasswordSchema = Joi.object({
  password: Joi.string()
    .required()
    .empty()
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'))
    .min(8)
    .max(30)
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'any.required': FIELD_IS_REQUIRED,
      'string.empty': FIELD_IS_EMPTY,
      'string.min': FIELD_MIN_LENGTH,
      'string.max': FIELD_MAX_LENGTH,
      'string.pattern.base': FIELD_IS_PASSWORD,
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
      'string.empty': FIELD_IS_EMPTY,
    }),
});

const sendUpdateEmailSchema = Joi.object({
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
});

const sendUpdateNewEmailSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required()
    .empty()
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.email': FIELD_IS_EMAIL,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
});

const sendUpdatePassword = Joi.object({
  password: Joi.string()
    .required()
    .empty()
    .messages({
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
    }),
  updatedPassword: Joi.string()
    .required()
    .min(8)
    .max(30)
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$'))
    .messages({
      'string.base': FIELD_NOT_A_STRING,
      'string.empty': FIELD_IS_EMPTY,
      'any.required': FIELD_IS_REQUIRED,
      'string.min': FIELD_MIN_LENGTH,
      'string.max': FIELD_MAX_LENGTH,
      'string.pattern.base': FIELD_IS_PASSWORD,
    }),
  confirmUpdatedPassword: Joi.string()
    .required()
    .valid(Joi.ref('updatedPassword'))
    .messages({
      'any.required': FIELD_IS_REQUIRED,
      'any.only': FIELD_IS_CONFIRM_PASSWORD,
    }),
});

const options: Joi.ValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
};

export const validateSignIn = (user: any) => userSignInSchema
  .validate(user, options);
export const validateLogIn = (user: any) => userLogInSchema
  .validate(user, options);
export const validateResetPasswordSchema = (email: any) => resetPasswordSchema
  .validate(email, options);
export const validateModifyPasswordSchema = (passwords: any) => modifyPasswordSchema
  .validate(passwords, options);
export const validateSendUpdateEmailSchema = (password: any) => sendUpdateEmailSchema
  .validate(password);
export const validatesendUpdateNewEmailSchema = (email: any) => sendUpdateNewEmailSchema
  .validate(email, options);
export const validateSendUpdatePassword = (password: any) => sendUpdatePassword
  .validate(password);

export const normalizeJoiErrors = (errors: Joi.ValidationError) => {
  const normalizeErrors: {[key:string]: string} = {};
  errors.details.forEach((e) => {
    normalizeErrors[e.path[0]] = e.message;
  });
  return normalizeErrors;
};
