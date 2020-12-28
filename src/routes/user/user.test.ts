import bcrypt from 'bcrypt';
import request from 'supertest';

import User from '@root/src/db/models/user';
import '@src/helpers/initEnv';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

import { users, UserI } from './test.helper';

const sequelize = initSequelize();

const sendPostRequest = async (user: UserI) => request(initApp()).post('/users').send(user);

describe('users', () => {
  describe('POST', () => {
    beforeEach(async (done) => {
      try {
        await User.sync({ force: true });
        done();
      } catch (err) {
        done(err);
      }
    });

    afterAll((done) => {
      sequelize.close();
      done();
    });

    it('should return a user from post with 200 status code', async () => {
      const { status, body } = await sendPostRequest(users.newUser);
      expect(status).toBe(201);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('createdAt');
      expect(body).toHaveProperty('updatedAt');
      expect(body).toHaveProperty('password');
      expect(body.userName).toEqual(users.newUser.userName);
      expect(body.email).toEqual(users.newUser.email);
      expect(body.deletedAt).toEqual(null);
    });

    it('should have an encrypted password', async () => {
      const { body: { password } } = await sendPostRequest(users.newUser);
      const passwordMatch = await bcrypt.compare(users.newUser.password, password);
      expect(passwordMatch).toBe(true);
    });

    describe('should have', () => {
      it('one user after posting', async () => {
        await sendPostRequest(users.newUser);
        const { body } = await request(initApp()).get('/users');
        expect(body.length).toBe(1);
      });

      it('two users after posting twice', async () => {
        await sendPostRequest(users.newUser);
        await sendPostRequest(users.newUserTwo);
        const { body } = await request(initApp()).get('/users');
        expect(body.length).toBe(2);
      });
    });

    describe('should return error 400', () => {
      describe('if username', () => {
        it('is not a string', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithUserNameNotString);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'should be a type of \'text\'',
            },
          });
        });
        it('is empty', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithEmptyUserName);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'cannot be an empty field',
            },
          });
        });
        it('contain spaces', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithUserNameWithSpaces);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'cannot contain spaces',
            },
          });
        });
        it('is less than 3 chars', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithUserNameLessThanThree);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'should have a minimum length of 3',
            },
          });
        });
        it('is more than 30 chars', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithUserNameMoreThanThirty);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: 'should have a maximum length of 30',
            },
          });
        });
        it('is already taken', async () => {
          await sendPostRequest(users.newUser);
          const { status, body } = await sendPostRequest(users.newUserWithSameUserName);
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
          const { status, body } = await sendPostRequest(users.newUserWithEmptyEmail);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'cannot be an empty field',
            },
          });
        });
        it('is not valid', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithEmailNotValid);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'should be a valid email',
            },
          });
        });
        it('already taken', async () => {
          await sendPostRequest(users.newUser);
          const { status, body } = await sendPostRequest(users.newUserWithSameEmail);
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
          const { status, body } = await sendPostRequest(users.newUserWithEmptyPassword);
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
          } = await sendPostRequest(users.newUserWithPasswordLessThanHeightChars);
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
          } = await sendPostRequest(users.newUserWithPasswordMoreThanThirtyChars);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'should have a maximum length of 30',
            },
          });
        });
        it('doesn\'t contain any uppercase', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithPasswordWithoutUppercase);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'need at least on lowercase, one uppercase, one number and one special char',
            },
          });
        });
        it('doesn\'t contain any lowercase', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithPasswordWithoutLowercase);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'need at least on lowercase, one uppercase, one number and one special char',
            },
          });
        });
        it('doesn\'t contain any number', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithPasswordWithoutNumber);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: 'need at least on lowercase, one uppercase, one number and one special char',
            },
          });
        });
        it('doesn\'t contain any special char', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithPasswordWithoutChar);
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
          const { status, body } = await sendPostRequest(users.newUserWithEmptyConfirmPassword);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              confirmPassword: 'cannot be an empty field',
            },
          });
        });
        it('and password not match', async () => {
          const { status, body } = await sendPostRequest(users.newUserWithPasswordsNotMatch);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              confirmPassword: 'must match password',
            },
          });
        });
      });
    });
  });
});
