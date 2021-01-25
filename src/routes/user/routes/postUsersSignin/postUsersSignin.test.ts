import { Server } from 'http';
import bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';
import {
  ALREADY_TAKEN,
  FIELD_HAS_SPACES,
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_EMPTY,
  FIELD_IS_EMAIL,
  FIELD_IS_PASSWORD,
  FIELD_MIN_LENGTH_OF_HEIGH,
  FIELD_MIN_LENGTH_OF_THREE,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';
import * as email from '@src/helpers/email';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const clearDatas = async (sequelize: Sequelize) => {
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
};

const newUser = {
  confirmPassword: 'Aaoudjiuvhds90!',
  email: 'user@email.com',
  password: 'Aaoudjiuvhds90!',
  userName: 'user',
};

describe('users', () => {
  let app: Server;
  let sequelize: Sequelize;
  beforeAll((done) => {
    app = initApp();
    sequelize = initSequelize();
    done();
  });
  beforeEach(async (done) => {
    try {
      await clearDatas(sequelize);
    } catch (err) {
      done(err);
    }
    done();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async (done) => {
    try {
      await clearDatas(sequelize);
      await sequelize.close();
      app.close();
      done();
    } catch (err) {
      done(err);
    }
  });

  describe('signin', () => {
    describe('POST', () => {
      describe('should return status 200 and', () => {
        let response: request.Response;
        let bcryptMock: jest.SpyInstance;
        let sendConfirmAccountMocked: jest.SpyInstance;
        beforeEach(async (done) => {
          try {
            bcryptMock = jest.spyOn(bcrypt, 'hash');
            sendConfirmAccountMocked = jest.spyOn(email, 'sendConfirmAccount');
            response = await request(app)
              .post('/users/signin')
              .send(newUser);
            done();
          } catch (err) {
            done(err);
          }
        });
        it('should return a user from post with 200 status code', async () => {
          const { status, body } = response;
          expect(status).toBe(201);
          expect(body).toHaveProperty('id');
          expect(body).toHaveProperty('createdAt');
          expect(body).toHaveProperty('updatedAt');
          expect(body).toHaveProperty('password');
          expect(body.userName).toEqual(newUser.userName);
          expect(body.email).toEqual(newUser.email);
          expect(body.deletedAt).toEqual(null);
          expect(body.confirmed).toEqual(false);
          expect(body.currentProfilePictureId).toBeNull();
        });
        it('should have an encrypted password', async () => {
          const { body: { password } } = response;
          const passwordMatch = await bcrypt.compare(newUser.password, password);
          expect(bcryptMock).toHaveBeenCalledTimes(1);
          expect(passwordMatch).toBe(true);
        });
        it('should send an email', async () => {
          expect(sendConfirmAccountMocked).toHaveBeenCalledTimes(1);
        });
        it('should have one user after posting', async () => {
          const allUsers = await User.findAll();
          expect(allUsers.length).toBe(1);
        });
      });
    });
    describe('should return error 400', () => {
      describe('if username', () => {
        it('is not a string', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              userName: 1234567890,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: FIELD_NOT_A_STRING,
            },
          });
        });
        it('is empty', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              userName: '',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: FIELD_IS_EMPTY,
            },
          });
        });
        it('contain spaces', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              userName: 'user name',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: FIELD_HAS_SPACES,
            },
          });
        });
        it('is less than 3 chars', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              userName: 'aa',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: FIELD_MIN_LENGTH_OF_THREE,
            },
          });
        });
        it('is more than 30 chars', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              userName: 'a'.repeat(31),
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: FIELD_MAX_LENGTH_THRITY,
            },
          });
        });
        it('is already taken', async () => {
          await User.create(newUser);
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              email: 'user2@email.com',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userName: ALREADY_TAKEN,
            },
          });
        });
      });
      describe('if email', () => {
        it('is empty', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              email: '',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: FIELD_IS_EMPTY,
            },
          });
        });
        it('is not valid', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              email: 'notValid',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: FIELD_IS_EMAIL,
            },
          });
        });
        it('is already taken', async () => {
          await request(app)
            .post('/users/signin')
            .send(newUser);
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              userName: 'user2',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: ALREADY_TAKEN,
            },
          });
        });
      });
      describe('if password', () => {
        it('is empty', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              password: '',
              confirmPassword: '',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_EMPTY,
            },
          });
        });
        it('contain less than 8 chars', async () => {
          const passwordLessThanHeightChar = 'Abc9!';
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              password: passwordLessThanHeightChar,
              confirmPassword: passwordLessThanHeightChar,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_MIN_LENGTH_OF_HEIGH,
            },
          });
        });
        it('contain more than 30 chars', async () => {
          const passwordMoreThanThirtyChar = `Ac9!${'a'.repeat(31)}`;
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              password: passwordMoreThanThirtyChar,
              confirmPassword: passwordMoreThanThirtyChar,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_MAX_LENGTH_THRITY,
            },
          });
        });
        it('doesn\'t contain any uppercase', async () => {
          const passwordWithoutUppercase = 'aaoudjiuvhds9!';
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              password: passwordWithoutUppercase,
              confirmPassword: passwordWithoutUppercase,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_PASSWORD,
            },
          });
        });
        it('doesn\'t contain any lowercase', async () => {
          const passwordWithoutLowercase = 'AAOUDJIUVHDS9!';
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              password: passwordWithoutLowercase,
              confirmPassword: passwordWithoutLowercase,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_PASSWORD,
            },
          });
        });
        it('doesn\'t contain any number', async () => {
          const passwordWithoutNumber = 'AAOUDJIUVHDS!';
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              password: passwordWithoutNumber,
              confirmPassword: passwordWithoutNumber,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_PASSWORD,
            },
          });
        });
        it('doesn\'t contain any special char', async () => {
          const passwordWithoutSpecialChar = 'Aaoudjiuvhds9';
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              password: passwordWithoutSpecialChar,
              confirmPassword: passwordWithoutSpecialChar,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_PASSWORD,
            },
          });
        });
      });
      describe('if confirmPassword', () => {
        it('is empty', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              confirmPassword: '',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              confirmPassword: FIELD_IS_EMPTY,
            },
          });
        });
        it('and password not match', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              ...newUser,
              confirmPassword: 'wrongPassword',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              confirmPassword: FIELD_IS_CONFIRM_PASSWORD,
            },
          });
        });
      });
      describe('if all field', () => {
        it('are empty', async () => {
          const { status, body } = await request(app)
            .post('/users/signin')
            .send({
              email: '',
              userName: '',
              password: '',
              confirmPassword: '',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: FIELD_IS_EMPTY,
              userName: FIELD_IS_EMPTY,
              password: FIELD_IS_EMPTY,
            },
          });
        });
      });
      describe('if userName and email', () => {
        it('already exists', async () => {
          await request(app)
            .post('/users/signin')
            .send(newUser);
          const { status, body } = await request(app)
            .post('/users/signin')
            .send(newUser);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: ALREADY_TAKEN,
              userName: ALREADY_TAKEN,
            },
          });
        });
      });
    });
  });
});
