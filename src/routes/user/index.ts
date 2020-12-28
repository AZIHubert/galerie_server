import { Router } from 'express';
import Joi from 'joi';

import User from '@root/src/db/models/user';

const router = Router();

const userSchema = Joi.object({
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
      'any.only': 'must match password',
      'string.empty': 'cannot be an empty field',
    }),
});

const options: Joi.ValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
  stripUnknown: true,
};

const normalizeJoiErrors = (errors: Joi.ValidationError) => {
  const normalizeErrors: any = {
    errors: {},
  };
  errors.details.forEach((e) => {
    normalizeErrors.errors[e.path[0]] = e.message;
  });
  return normalizeErrors;
};

const normalizeSequelizeErrors = (errors: any) => {
  const normalizeErrors: any = {
    errors: {},
  };
  if (errors.original.constraint === 'users_userName_key') {
    normalizeErrors.errors.userName = 'already taken';
  }
  if (errors.original.constraint === 'users_email_key') {
    normalizeErrors.errors.email = 'already taken';
  }
  return normalizeErrors;
};

router.get('/', async (_, res, next) => {
  try {
    const users = await User.findAll();
    res.status(200).send(users);
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: 'Something went wrong.',
    });
  }
  return next();
});

router.post('/', async (req, res, next) => {
  const { error } = userSchema.validate(req.body, options);
  // console.log(error?.details[0]);
  if (error) {
    res.status(400).send(normalizeJoiErrors(error));
    return next();
  }
  try {
    const newUser = await User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
    });
    res.status(201).send(newUser);
  } catch (err) {
    // console.log(err.original.constraint);
    const errors = normalizeSequelizeErrors(err);
    if (Object.keys(errors.errors).length) {
      res.status(400).send(errors);
      return next();
    }
    res.status(500).send('Something went wrong.');
  }
  return next();
});

export default router;
