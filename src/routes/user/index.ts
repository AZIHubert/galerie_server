import bcrypt from 'bcrypt';
import { Router } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import nodemailer from 'nodemailer';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';

const router = Router();

const saltRounds = 10;

const MAIL_USERNAME = accEnv('MAIL_USERNAME');
const MAIL_PASSWORD = accEnv('MAIL_PASSWORD');
const EMAIL_SECRET = accEnv('EMAIL_SECRET');

const mailConfig = {
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD,
  },
};
const transporter = nodemailer.createTransport(mailConfig);

const message = (email: string, token: string) => ({
  from: 'Galeries <sender@mail.com>',
  to: email,
  subject: 'validate your account',
  text: 'Hello',
  html: `<html>
    <body>
      <h1>Galeries</h1>
      <p>Please click this link to confirm your email:</p>
      <a href='https://www.localhost:3000/confirmation/${token}'>
        https://www.localhost:3000/confirmation/${token}
      </a>
    </body>
  </html>`,
});

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
  const normalizeErrors: any = {};
  errors.details.forEach((e) => {
    normalizeErrors[e.path[0]] = e.message;
  });
  return normalizeErrors;
};

const normalizeSequelizeErrors = async (email: string, userName: string) => {
  const normalizeErrors: any = {};
  const emailAlreadyUse = await User.findOne({ where: { email } });
  if (emailAlreadyUse) {
    normalizeErrors.email = 'already taken';
  }
  const userNameAlreadyUse = await User.findOne({ where: { userName } });
  if (userNameAlreadyUse) {
    normalizeErrors.userName = 'already taken';
  }
  return normalizeErrors;
};

router.get('/', async (__, res, next) => {
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

router.post('/', async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body, options);
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }
    const errors = await normalizeSequelizeErrors(req.body.email, req.body.userName);
    if (Object.keys(errors).length) {
      return res.status(400).send({
        errors,
      });
    }

    const hashPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newUser = await User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: hashPassword,
    });
    jwt.sign(
      {
        user: _.pick(newUser, 'id'),
      },
      EMAIL_SECRET,
      {
        expiresIn: '2d',
      },
      (err, emailToken) => {
        if (err) throw new Error(`something went wrong: ${err}`);
        if (emailToken) transporter.sendMail(message(req.body.email, emailToken));
      },
    );
    return res.status(201).send(newUser);
  } catch (err) {
    return res.status(500).send('Something went wrong.');
  }
});

router.get('/confirmation/', async (req, res) => {
  try {
    const { confirmation } = req.headers;
    if (confirmation) {
      const token = (<string>confirmation).split(' ')[1];
      if (token) {
        const { user: { id } } = jwt.verify(
          token,
          EMAIL_SECRET,
        ) as {user: { id: string; }};
        await User.update({ confirmed: true }, { where: { id } });
        return res.status(200).end();
      }
      return res.status(400).send({ errors: 'wrong token' });
    }
    return res.status(400).send({ errors: 'confirmation token not found' });
  } catch (err) {
    return res.status(400).send(err);
  }
});

export default router;
