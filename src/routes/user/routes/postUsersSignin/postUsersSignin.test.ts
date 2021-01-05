import bcrypt from 'bcrypt';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

import { users, UserI } from '../../test.helper';

const sequelize = initSequelize();

const sendSignInRequest = async (user: UserI) => request(initApp()).post('/users/signin').send(user);

describe('users', () => {
  beforeEach(async (done) => {
    try {
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    sequelize.close();
    done();
  });

  describe('login', () => {
    describe('POST', () => {
      it('should return a user from post with 200 status code', async () => {
        const { status, body } = await sendSignInRequest(users.newUser);
        expect(status).toBe(201);
        expect(body).toHaveProperty('id');
        expect(body).toHaveProperty('createdAt');
        expect(body).toHaveProperty('updatedAt');
        expect(body).toHaveProperty('password');
        expect(body.userName).toEqual(users.newUser.userName);
        expect(body.email).toEqual(users.newUser.email);
        expect(body.deletedAt).toEqual(null);
        expect(body.confirmed).toEqual(false);
      });
      it('should have an encrypted password', async () => {
        const bcryptMock = jest.spyOn(bcrypt, 'hash');
        const { body: { password } } = await sendSignInRequest(users.newUser);
        const passwordMatch = await bcrypt.compare(users.newUser.password, password);
        expect(bcryptMock).toHaveBeenCalledTimes(1);
        expect(passwordMatch).toBe(true);
      });
      it('should send an email', async () => {
        const sendConfirmAccountMocked = jest.spyOn(email, 'sendConfirmAccount');
        await sendSignInRequest(users.newUser);
        expect(sendConfirmAccountMocked).toHaveBeenCalledTimes(1);
        sendConfirmAccountMocked.mockRestore();
      });
      describe('should have', () => {
        it('one user after posting', async () => {
          await sendSignInRequest(users.newUser);
          const allUsers = await User.findAll();
          expect(allUsers.length).toBe(1);
        });

        it('two users after posting twice', async () => {
          await sendSignInRequest(users.newUser);
          await sendSignInRequest(users.newUserTwo);
          const allUsers = await User.findAll();
          expect(allUsers.length).toBe(2);
        });
      });
    });
    describe('should return error 400', () => {
      describe('if username', () => {
        it('is not a string', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithUserNameNotString);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'should be a type of \'text\'',
            },
          });
        });
        it('is empty', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithEmptyUserName);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'cannot be an empty field',
            },
          });
        });
        it('contain spaces', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithUserNameWithSpaces);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'cannot contain spaces',
            },
          });
        });
        it('is less than 3 chars', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithUserNameLessThanThree);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'should have a minimum length of 3',
            },
          });
        });
        it('is more than 30 chars', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithUserNameMoreThanThirty);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'should have a maximum length of 30',
            },
          });
        });
        it('is already taken', async () => {
          await sendSignInRequest(users.newUser);
          const { status, body } = await sendSignInRequest(users.newUserWithSameUserName);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'already taken',
            },
          });
        });
      });
      describe('if email', () => {
        it('is empty', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithEmptyEmail);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'cannot be an empty field',
            },
          });
        });
        it('is not valid', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithEmailNotValid);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'should be a valid email',
            },
          });
        });
        it('is already taken', async () => {
          await sendSignInRequest(users.newUser);
          const { status, body } = await sendSignInRequest(users.newUserWithSameEmail);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'already taken',
            },
          });
        });
      });
      describe('if password', () => {
        it('is empty', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithEmptyPassword);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'cannot be an empty field',
            },
          });
        });
        it('contain less than 8 chars', async () => {
          const {
            status,
            body,
          } = await sendSignInRequest(users.newUserWithPasswordLessThanHeightChars);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'should have a minimum length of 8',
            },
          });
        });
        it('contain more than 30 chars', async () => {
          const {
            status,
            body,
          } = await sendSignInRequest(users.newUserWithPasswordMoreThanThirtyChars);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'should have a maximum length of 30',
            },
          });
        });
        it('doesn\'t contain any uppercase', async () => {
          const { status, body } = await sendSignInRequest(
            users.newUserWithPasswordWithoutUppercase,
          );
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'need at least on lowercase, one uppercase, one number and one special char',
            },
          });
        });
        it('doesn\'t contain any lowercase', async () => {
          const { status, body } = await sendSignInRequest(
            users.newUserWithPasswordWithoutLowercase,
          );
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'need at least on lowercase, one uppercase, one number and one special char',
            },
          });
        });
        it('doesn\'t contain any number', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithPasswordWithoutNumber);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'need at least on lowercase, one uppercase, one number and one special char',
            },
          });
        });
        it('doesn\'t contain any special char', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithPasswordWithoutChar);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'need at least on lowercase, one uppercase, one number and one special char',
            },
          });
        });
      });
      describe('if confirmPassword', () => {
        it('is empty', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithEmptyConfirmPassword);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              confirmPassword: 'cannot be an empty field',
            },
          });
        });
        it('and password not match', async () => {
          const { status, body } = await sendSignInRequest(users.newUserWithPasswordsNotMatch);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              confirmPassword: 'must match password',
            },
          });
        });
      });
      describe('if all field', () => {
        it('are empty', async () => {
          const { status, body } = await sendSignInRequest({
            email: '',
            userName: '',
            password: '',
            confirmPassword: '',
          });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'cannot be an empty field',
              userName: 'cannot be an empty field',
              password: 'cannot be an empty field',
            },
          });
        });
      });
      describe('if userName and email', () => {
        it('already exists', async () => {
          await sendSignInRequest(users.newUser);
          const { status, body } = await sendSignInRequest(users.newUser);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'already taken',
              userName: 'already taken',
            },
          });
        });
      });
    });
  });
});
