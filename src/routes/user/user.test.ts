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
      expect(body.userName).toEqual(users.newUser.userName);
      expect(body.email).toEqual(users.newUser.email);
      expect(body.password).toEqual(users.newUser.password);
      expect(body.deletedAt).toEqual(null);
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
          const { status } = await sendPostRequest(users.newUserWithEmailNotValid);
          expect(status).toBe(400);
        });
        it('already taken', async () => {
          await sendPostRequest(users.newUser);
          const { status } = await sendPostRequest(users.newUserWithSameEmail);
          expect(status).toBe(400);
        });
      });
      describe('if password', () => {
        it('is empty', async () => {
          const { status } = await sendPostRequest(users.newUserWithEmptyPassword);
          expect(status).toBe(400);
        });
        it('contain less than 8 chars', async () => {
          const { status } = await sendPostRequest(users.newUserWithPasswordLessThanHeightChars);
          expect(status).toBe(400);
        });
        it('contain more than 30 chars', async () => {
          const { status } = await sendPostRequest(users.newUserWithPasswordMoreThanThirtyChars);
          expect(status).toBe(400);
        });
        it('doesn\'t contain any uppercase', async () => {
          const { status } = await sendPostRequest(users.newUserWithPasswordWithoutUppercase);
          expect(status).toBe(400);
        });
        it('doesn\'t contain any lowercase', async () => {
          const { status } = await sendPostRequest(users.newUserWithPasswordWithoutLowercase);
          expect(status).toBe(400);
        });
        it('doesn\'t contain any number', async () => {
          const { status } = await sendPostRequest(users.newUserWithPasswordWithoutNumber);
          expect(status).toBe(400);
        });
        it('doesn\'t contain any special char', async () => {
          const { status } = await sendPostRequest(users.newUserWithPasswordWithoutChar);
          expect(status).toBe(400);
        });
      });
      describe('if confirmPassword', () => {
        it('is empty', async () => {
          const { status } = await sendPostRequest(users.newUserWithEmptyConfirmPassword);
          expect(status).toBe(400);
        });
        it('and password not match', async () => {
          const { status } = await sendPostRequest(users.newUserWithPasswordsNotMatch);
          expect(status).toBe(400);
        });
      });
    });
  });
});
