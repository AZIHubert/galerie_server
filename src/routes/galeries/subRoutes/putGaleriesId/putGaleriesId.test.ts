import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createUser,
  createGalerie,
  createGalerieUser,
  putGaleriesId,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('PUT', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const {
            user: createdUser,
          } = await createUser({});
          user = createdUser;
          const jwt = signAuthToken(user);
          token = jwt.token;
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

      describe('should return status 200 and', () => {
        it('update galerie\'s name && description', async () => {
          const newDescription = 'new galerie\'s description';
          const newName = 'new galerie\'s name';
          const galerie = await createGalerie({
            userId: user.id,
          });
          const {
            body: {
              action,
              data,
            },
            status,
          } = await putGaleriesId(app, token, galerie.id, {
            body: {
              description: newDescription,
              name: newName,
            },
          });
          await galerie.reload();
          expect(action).toBe('PUT');
          expect(data).toEqual({
            description: newDescription,
            galerieId: galerie.id,
            name: newName,
          });
          expect(galerie.description).toBe(newDescription);
          expect(galerie.name).toBe(newName);
          expect(status).toBe(200);
        });
        it('don\'t update galerie\'s description if request.body.description is undefined', async () => {
          const description = 'galerie\'s description';
          const newName = 'new galerie\'s name';
          const galerie = await createGalerie({
            description,
            userId: user.id,
          });
          const {
            body: {
              action,
              data,
            },
            status,
          } = await putGaleriesId(app, token, galerie.id, {
            body: {
              name: newName,
            },
          });
          await galerie.reload();
          expect(action).toBe('PUT');
          expect(data).toEqual({
            description,
            galerieId: galerie.id,
            name: newName,
          });
          expect(galerie.description).toBe(description);
          expect(galerie.name).toBe(newName);
          expect(status).toBe(200);
        });
        it('don\'t update galerie\'s name if request.body.name is undefined', async () => {
          const newDescription = 'new galerie\'s description';
          const name = 'galerie\'s name';
          const galerie = await createGalerie({
            description: 'galerie\'s description',
            name,
            userId: user.id,
          });
          const {
            body: {
              action,
              data,
            },
            status,
          } = await putGaleriesId(app, token, galerie.id, {
            body: {
              description: newDescription,
            },
          });
          await galerie.reload();
          expect(action).toBe('PUT');
          expect(data).toEqual({
            description: newDescription,
            galerieId: galerie.id,
            name,
          });
          expect(galerie.description).toBe(newDescription);
          expect(galerie.name).toBe(name);
          expect(status).toBe(200);
        });
        it('update galerie if current user is an admin of this galerie', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { token: tokenTwo } = signAuthToken(userTwo);
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: userTwo.id,
          });
          const {
            status,
          } = await putGaleriesId(app, tokenTwo, galerieId, {
            body: {
              name: 'new galerie\'s name',
            },
          });
          expect(status).toBe(200);
        });
        it('regenerate hidden name if galerie\'s name is already used', async () => {
          const { name } = await createGalerie({
            userId: user.id,
          });
          const galerie = await createGalerie({
            name: `${name}a`,
            userId: user.id,
          });
          await putGaleriesId(app, token, galerie.id, {
            body: {
              name,
            },
          });
          await galerie.reload();
          expect(galerie.hiddenName).toBe(`${name}-1`);
        });
        it('do not regenerate hidden name if galerie\'s name not used', async () => {
          const galerie = await createGalerie({
            userId: user.id,
          });
          const name = `${galerie.name}1`;
          await putGaleriesId(app, token, galerie.id, {
            body: {
              name,
            },
          });
          await galerie.reload();
          expect(galerie.hiddenName).toBe(`${name}-0`);
        });
      });
      describe('should return error 400 if', () => {
        it('req.body is an empty object', async () => {
          const {
            body,
            status,
          } = await putGaleriesId(app, token, uuidv4());
          expect(body.errors).toBe('no change submited');
          expect(status).toBe(400);
        });
        it('req.body.description === galerie.description && req.body.name === req.body.name', async () => {
          const {
            description,
            id: galerieId,
            name,
          } = await createGalerie({
            description: 'galerie\'s description',
            userId: user.id,
          });
          const {
            body,
            status,
          } = await putGaleriesId(app, token, galerieId, {
            body: {
              description,
              name,
            },
          });
          expect(body.errors).toBe('no change submited');
          expect(status).toBe(400);
        });
        it('request.params.galerieId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await putGaleriesId(app, token, '100', {
            body: {
              name: '',
            },
          });
          expect(body.errors).toBe(INVALID_UUID('galerie'));
          expect(status).toBe(400);
        });
        it('user role is \'user\'', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { token: tokenTwo } = signAuthToken(userTwo);
          await createGalerieUser({
            galerieId,
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await putGaleriesId(app, tokenTwo, galerieId, {
            body: {
              name: 'new galerie\'s name',
            },
          });
          expect(body.errors).toBe('you\'re not allow to update this galerie');
          expect(status).toBe(400);
        });
        it('galerie is archived', async () => {
          const { id: galerieId } = await createGalerie({
            archived: true,
            userId: user.id,
          });
          const {
            body,
            status,
          } = await putGaleriesId(app, token, galerieId, {
            body: {
              name: 'new galerie\'s name',
            },
          });

          expect(body.errors).toBe('you cannot update an archived galerie');
          expect(status).toBe(400);
        });
        describe('description', () => {
          let galerieId: string;

          beforeEach(async (done) => {
            try {
              const galerie = await createGalerie({
                userId: user.id,
              });
              galerieId = galerie.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('is not a string', async () => {
            const {
              body,
              status,
            } = await putGaleriesId(app, token, galerieId, {
              body: {
                description: 1234,
              },
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
            } = await putGaleriesId(app, token, galerieId, {
              body: {
                description: 'a'.repeat(201),
              },
            });
            expect(body.errors).toEqual({
              description: FIELD_MAX_LENGTH(200),
            });
            expect(status).toBe(400);
          });
        });
        describe('name', () => {
          let galerieId: string;

          beforeEach(async (done) => {
            try {
              const galerie = await createGalerie({
                userId: user.id,
              });
              galerieId = galerie.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await putGaleriesId(app, token, galerieId, {
              body: {
                name: '',
              },
            });
            expect(body.errors).toEqual({
              name: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await putGaleriesId(app, token, galerieId, {
              body: {
                name: 1234,
              },
            });
            expect(body.errors).toEqual({
              name: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('has less than 3 characters', async () => {
            const {
              body,
              status,
            } = await putGaleriesId(app, token, galerieId, {
              body: {
                name: 'a'.repeat(2),
              },
            });
            expect(body.errors).toEqual({
              name: FIELD_MIN_LENGTH(3),
            });
            expect(status).toBe(400);
          });
          it('has more than 30 characters', async () => {
            const {
              body,
              status,
            } = await putGaleriesId(app, token, galerieId, {
              body: {
                name: 'a'.repeat(31),
              },
            });
            expect(body.errors).toEqual({
              name: FIELD_MAX_LENGTH(30),
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('it should return error 404 if', () => {
        it('galerie not found', async () => {
          const {
            body,
            status,
          } = await putGaleriesId(app, token, uuidv4(), {
            body: {
              name: 'new galerie\'s name',
            },
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
        it('galerie exist but user is not subscribe to it', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await putGaleriesId(app, token, galerieId, {
            body: {
              name: 'new galerie\'s name',
            },
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
