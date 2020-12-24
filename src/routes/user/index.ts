import { Router } from 'express';
import Joi from 'joi';

import User from '@src/db/models/users';

const router = Router();

const userSchema = Joi.object({
  userName: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .empty()
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
      'email.base': 'should be valid email',
      'string.empty': 'cannot be an empty field',
      'any.required': 'is required',
    }),
  password: Joi.string()
    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$')),
  // Minimum 9 chars.
  // Maximum 30 chars.
  // At least one uppercase letter.
  // At least one lowercase letter.
  // At least one number.
  // At least one special char.
  confirmPassword: Joi.ref('password'),
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

router.get('/', async (_, res) => {
  try {
    const users = await User.findAll();
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({
      message: 'Something went wrong.',
    });
  }
});

router.post('/', async (req, res, next) => {
  const { error } = userSchema.validate(req.body, options);
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
    res.status(200).send(newUser);
  } catch (err) {
    const errors: any = {
      errors: {},
    };
    if (err.original.constraint === 'users_userName_key') {
      errors.errors.userName = 'already taken';
    }
    res.status(400).send(errors);
  }
  return next();
});

export default router;
