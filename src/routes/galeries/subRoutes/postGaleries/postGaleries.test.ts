import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Galerie,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  postGaleries,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
} from '@src/helpers/errorMessages';

const userPassword = 'Password0!';

describe('/galerie', () => {
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
      const { body } = await postUsersLogin(app, {
        body: {
          password: userPassword,
          userNameOrEmail: user.email,
        },
      });
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
    describe('should return status 200 and', () => {
      it('create a galerie', async () => {
        const name = 'galeries\'s name';
        const {
          body: {
            action,
            data: {
              galerie: returnedGalerie,
            },
          },
          status,
        } = await postGaleries(app, token, { name });
        const galerie = await Galerie.findByPk(returnedGalerie.id);
        expect(action).toBe('POST');
        expect(galerie).not.toBeNull();
        expect(returnedGalerie.archived).toBeFalsy();
        expect(returnedGalerie.createdAt).not.toBeUndefined();
        expect(returnedGalerie.currentCoverPicture).toBeNull();
        expect(returnedGalerie.defaultCoverPicture).not.toBeUndefined();
        expect(returnedGalerie.description).toBe('');
        expect(returnedGalerie.id).not.toBeUndefined();
        expect(returnedGalerie.name).toBe(name);
        expect(returnedGalerie.role).toBe('creator');
        expect(returnedGalerie.updatedAt).toBeUndefined();
        expect(returnedGalerie.users.length).toBe(0);
        expect(status).toBe(200);
      });
      it('create galerie with descrition', async () => {
        const description = 'galerie\'s description';
        const {
          body: {
            data: {
              galerie,
            },
          },
        } = await postGaleries(app, token, {
          name: 'galerie\'s name',
          description,
        });
        expect(galerie.description).toBe(description);
      });
      it('create a galerie with an empty description', async () => {
        const description = '';
        const {
          body: {
            data: {
              galerie,
            },
          },
        } = await postGaleries(app, token, {
          name: 'galerie\'s name',
          description,
        });
        expect(galerie.description).toBe(description);
      });
      it('trim request.body', async () => {
        const name = 'galeries\'s name';
        const description = 'galerie\'s description';
        const {
          body: {
            data: {
              galerie,
            },
          },
        } = await postGaleries(app, token, {
          description: ` ${description} `,
          name: ` ${name} `,
        });
        expect(galerie.description).toBe(description);
        expect(galerie.name).toBe(name);
      });
    });
    describe('should return status 400 if', () => {
      describe('description', () => {
        it('is not a string', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {
            description: 1234,
            name: 'galerie\'s name',
          });
          expect(body.errors).toEqual({
            description: FIELD_SHOULD_BE_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('has more than 200 characters', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {
            description: 'a'.repeat(201),
            name: 'galerie\'s name',
          });
          expect(body.errors).toEqual({
            description: FIELD_MAX_LENGTH(200),
          });
          expect(status).toBe(400);
        });
      });
      describe('name', () => {
        it('is not send', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, {});
          expect(body.errors).toEqual({
            name: FIELD_IS_REQUIRED,
          });
          expect(status).toBe(400);
        });
        it('is an empty string', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, { name: '' });
          expect(body.errors).toEqual({
            name: FIELD_CANNOT_BE_EMPTY,
          });
          expect(status).toBe(400);
        });
        it('is not a string', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, { name: 1234 });
          expect(body.errors).toEqual({
            name: FIELD_SHOULD_BE_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('is less than 3 characters', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, { name: 'a'.repeat(2) });
          expect(body.errors).toEqual({
            name: FIELD_MIN_LENGTH(3),
          });
          expect(status).toBe(400);
        });
        it('is more than 30 characters', async () => {
          const {
            body,
            status,
          } = await postGaleries(app, token, { name: 'a'.repeat(31) });
          expect(body.errors).toEqual({
            name: FIELD_MAX_LENGTH(30),
          });
          expect(status).toBe(400);
        });
      });
    });
  });
});
