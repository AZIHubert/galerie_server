import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  login,
  postGalerie,
} from '@src/helpers/test';

import initApp from '@src/server';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_THREE,
} from '@src/helpers/errorMessages';

const userPassword = 'Password0!';

describe('galerie', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({
        role: 'superAdmin',
      });
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
    } catch (err) {
      done(err);
    }
    done();
  });

  afterAll(async (done) => {
    try {
      await sequelize.sync({ force: true });
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('POST', () => {
    describe('should return status 200', () => {
      it('and create a galerie', async () => {
        const name = 'galeries\'s name';
        const {
          body: {
            action,
            data: {
              galerie,
            },
          },
          status,
        } = await postGalerie(app, token, { name });
        expect(action).toBe('POST');
        expect(galerie.archived).toBeFalsy();
        expect(galerie.defaultCoverPicture).toBeTruthy();
        expect(galerie.id).toBeTruthy();
        expect(galerie.name).toBe(name);
        expect(galerie.updatedAt).toBeUndefined();
        expect(galerie.users.length).toBe(0);
        expect(status).toBe(200);
      });
    });
    describe('should return status 400 if', () => {
      describe('name', () => {
        it('is not send', async () => {
          const {
            body,
            status,
          } = await postGalerie(app, token, {});
          expect(body.errors).toEqual({
            name: FIELD_IS_REQUIRED,
          });
          expect(status).toBe(400);
        });
        it('is an empty string', async () => {
          const {
            body,
            status,
          } = await postGalerie(app, token, { name: '' });
          expect(body.errors).toEqual({
            name: FIELD_IS_EMPTY,
          });
          expect(status).toBe(400);
        });
        it('is not a string', async () => {
          const {
            body,
            status,
          } = await postGalerie(app, token, { name: 1234 });
          expect(body.errors).toEqual({
            name: FIELD_NOT_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('is less than 3 characters', async () => {
          const {
            body,
            status,
          } = await postGalerie(app, token, { name: 'a'.repeat(2) });
          expect(body.errors).toEqual({
            name: FIELD_MIN_LENGTH_OF_THREE,
          });
          expect(status).toBe(400);
        });
        it('is more than 30 characters', async () => {
          const {
            body,
            status,
          } = await postGalerie(app, token, { name: 'a'.repeat(31) });
          expect(body.errors).toEqual({
            name: FIELD_MAX_LENGTH_THRITY,
          });
          expect(status).toBe(400);
        });
      });
    });
  });
});
