import { Router } from 'express';
import Joi from 'joi';

import User from '@src/db/models/users';

const router = Router();

const userSchema = Joi.object({
  userName: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required(),
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required(),
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

router.get('/', async (_, res) => {
  try {
    const users = await User.findAll();
    res.status(200).send(users);
  } catch (err) {
    res.status(500).end();
  }
});

router.post('/', (req, res) => {
  const { error } = userSchema.validate(req.body, options);
  if (error) res.status(400).end();

  res.status(200).send({
    id: 0,
    userName: req.body.userName,
    email: req.body.email,
    password: req.body.password,
  });
});

export default router;
