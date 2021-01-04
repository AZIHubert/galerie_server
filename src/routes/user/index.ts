import bcrypt from 'bcrypt';
import express, { Router } from 'express';
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
const ACCES_SECRET = accEnv('ACCES_SECRET');
const COOKIE_LIFETIME = accEnv('COOKIE_LIFETIME');
const SECURE = accEnv('NODE_ENV') === 'production';

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

const isLoggedIn = (req: express.Request, res: express.Response, next: Function) => {
  const { access_token: accessToken } = req.cookies;
  if (accessToken) {
    try {
      jwt.verify(accessToken, ACCES_SECRET);
      return res.status(401).send({
        errors: 'you already logged in',
      });
    } catch (err) {
      return res.status(500).send({
        errors: 'invalid token',
      });
    }
  }
  return next();
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

router.post('/', isLoggedIn, async (req, res) => {
  try {
    // Validate body with Joi
    const { error } = userSchema.validate(req.body, options);
    // If error, send status 400
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }

    // Check if username or email are not already taken
    const errors = await normalizeSequelizeErrors(req.body.email, req.body.userName);
    if (Object.keys(errors).length) {
      return res.status(400).send({
        errors,
      });
    }

    // Save user
    const hashPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newUser = await User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: hashPassword,
    });

    // Send an email with a jwt to confirm account
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

router.get('/confirmation/', isLoggedIn, async (req, res) => {
  try {
    const { confirmation } = req.headers;
    if (confirmation) {
      const confirmationToken = (<string>confirmation).split(' ')[1];
      if (confirmationToken) {
        const { user: { id } } = jwt.verify(
          confirmationToken,
          EMAIL_SECRET,
        ) as {user: { id: string; }};
        const user = await User.findOne({ where: { id } });
        if (user) {
          if (!user.confirmed) {
            // If not, update his account end set a cookie for auth
            await User.update({ confirmed: true }, { where: { id } });

            // Create an access token for authentification
            const accessToken = jwt.sign({ id }, ACCES_SECRET);
            res.cookie('access_token', accessToken, {
              maxAge: COOKIE_LIFETIME,
              httpOnly: true,
              secure: SECURE,
            });
            return res.status(200).end();
          }
          return res.status(400).send({ errors: 'Your account is already confirmed' });
        }
        return res.status(400).send({ errors: 'User does not exist' });
      }
      return res.status(400).send({ errors: 'wrong token' });
    }
    return res.status(400).send({ errors: 'confirmation token not found' });
  } catch (err) {
    return res.status(500).send(err);
  }
});

export default router;
