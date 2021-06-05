import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Galerie,
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
import {
  createUser,
  deleteUsersMe,
  postGaleries,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postUsersLogin,
  putGaleriesId,
  putGaleriesIdUsersId,
} from '@src/helpers/test';

import initApp from '@src/server';

describe('/galeries', () => {
  let app: Server;
  let password: string;
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
      const {
        password: createdPassword,
        user: createdUser,
      } = await createUser({});

      password = createdPassword;
      user = createdUser;

      const { body } = await postUsersLogin(app, {
        body: {
          password,
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

  describe('/:galerieId', () => {
    describe('PUT', () => {
      describe('it should return status 200 and', () => {
        it('update galerie\'s name and description', async () => {
          const name = 'new galerie\'s name';
          const description = 'new galerie\'s description';
          const {
            body: {
              data: {
                galerie: {
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, token, {
            name: 'galeries\'s name',
          });
          const {
            body: {
              action,
              data,
            },
            status,
          } = await putGaleriesId(app, token, galerieId, {
            description,
            name,
          });
          const galerie = await Galerie.findByPk(galerieId) as Galerie;
          expect(action).toBe('PUT');
          expect(data).toEqual({
            description,
            galerieId,
            name,
          });
          expect(galerie.description).toBe(data.description);
          expect(galerie.name).toBe(data.name);
          expect(status).toBe(200);
        });
        it('don\'t update galerie\'s description if request.body.description is undefined', async () => {
          const name = 'new galerie\'s name';
          const {
            body: {
              data: {
                galerie: returnedGalerie,
              },
            },
          } = await postGaleries(app, token, {
            description: 'galerie\'s description',
            name: 'galeries\'s name',
          });
          const {
            body: {
              action,
              data,
            },
            status,
          } = await putGaleriesId(app, token, returnedGalerie.id, {
            name,
          });
          const galerie = await Galerie.findByPk(returnedGalerie.id) as Galerie;
          expect(action).toBe('PUT');
          expect(data).toEqual({
            description: returnedGalerie.description,
            galerieId: returnedGalerie.id,
            name,
          });
          expect(galerie.description).toBe(returnedGalerie.description);
          expect(galerie.name).toBe(data.name);
          expect(status).toBe(200);
        });
        it('don\'t update galerie\'s name if request.body.name is undefined', async () => {
          const description = 'new galerie\'s description';
          const {
            body: {
              data: {
                galerie: returnedGalerie,
              },
            },
          } = await postGaleries(app, token, {
            description: 'galerie\'s description',
            name: 'galeries\'s name',
          });
          const {
            body: {
              action,
              data,
            },
            status,
          } = await putGaleriesId(app, token, returnedGalerie.id, {
            description,
          });
          const galerie = await Galerie.findByPk(returnedGalerie.id) as Galerie;
          expect(action).toBe('PUT');
          expect(data).toEqual({
            description,
            galerieId: returnedGalerie.id,
            name: returnedGalerie.name,
          });
          expect(galerie.description).toBe(data.description);
          expect(galerie.name).toBe(returnedGalerie.name);
          expect(status).toBe(200);
        });
      });
      describe('it should return error 400 if', () => {
        it('req.body is an empty object', async () => {
          const {
            body,
            status,
          } = await putGaleriesId(app, token, uuidv4(), {});
          expect(body.errors).toBe('no change submited');
          expect(status).toBe(400);
        });
        it('req.body.description === galerie.description && req.body.name === req.body.name', async () => {
          const {
            body: {
              data: {
                galerie: {
                  description,
                  id: galerieId,
                  name,
                },
              },
            },
          } = await postGaleries(app, token, {
            description: 'galerie\'s description',
            name: 'galeries\'s name',
          });
          const {
            body,
            status,
          } = await putGaleriesId(app, token, galerieId, {
            description,
            name,
          });
          expect(body.errors).toBe('no change submited');
          expect(status).toBe(400);
        });
        it('request.params.galerieId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await putGaleriesId(app, token, '100', {
            name: '',
          });
          expect(body.errors).toBe(INVALID_UUID('galerie'));
          expect(status).toBe(400);
        });
        it('user role is \'user\'', async () => {
          const {
            body: {
              data: {
                galerie: {
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, token, {
            name: 'galeries\'s name',
          });
          const {
            password: passwordTwo,
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await postUsersLogin(app, {
            body: {
              password: passwordTwo,
              userNameOrEmail: userTwo.email,
            },
          });
          const {
            body: {
              data: {
                invitation: {
                  code,
                },
              },
            },
          } = await postGaleriesIdInvitations(app, token, galerieId, {});
          await postGaleriesSubscribe(app, tokenTwo, { code });
          const {
            body,
            status,
          } = await putGaleriesId(app, tokenTwo, galerieId, {
            name: 'new galerie\'s name',
          });
          expect(body.errors).toBe('you\'re not allow to update this galerie');
          expect(status).toBe(400);
        });
        it('galerie is archived', async () => {
          const {
            body: {
              data: {
                galerie: {
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, token, {
            name: 'galeries\'s name',
          });
          const {
            password: passwordTwo,
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await postUsersLogin(app, {
            body: {
              password: passwordTwo,
              userNameOrEmail: userTwo.email,
            },
          });
          const {
            body: {
              data: {
                invitation: {
                  code,
                },
              },
            },
          } = await postGaleriesIdInvitations(app, token, galerieId, {});
          await postGaleriesSubscribe(app, tokenTwo, { code });
          await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
          await deleteUsersMe(app, token, {
            deleteAccountSentence: 'delete my account',
            password,
            userNameOrEmail: user.email,
          });
          const {
            body,
            status,
          } = await putGaleriesId(app, tokenTwo, galerieId, {
            name: 'new galerie\'s name',
          });
          expect(body.errors).toBe('you cannot update an archived galerie');
          expect(status).toBe(400);
        });
        describe('description', () => {
          let galerieId: string;

          beforeEach(async (done) => {
            try {
              const {
                body: {
                  data: {
                    galerie: {
                      id,
                    },
                  },
                },
              } = await postGaleries(app, token, {
                name: 'galeries\'s name',
              });
              galerieId = id;
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
              description: 1234,
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
              description: 'a'.repeat(201),
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
              const {
                body: {
                  data: {
                    galerie: {
                      id,
                    },
                  },
                },
              } = await postGaleries(app, token, {
                name: 'galeries\'s name',
              });
              galerieId = id;
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
              name: '',
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
              name: 1234,
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
              name: 'a'.repeat(2),
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
              name: 'a'.repeat(31),
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
            name: 'new galerie\'s name',
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
        it('galerie exist but user is not subscribe to it', async () => {
          const {
            password: passwordTwo,
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await postUsersLogin(app, {
            body: {
              password: passwordTwo,
              userNameOrEmail: userTwo.email,
            },
          });
          const {
            body: {
              data: {
                galerie: {
                  id,
                },
              },
            },
          } = await postGaleries(app, tokenTwo, {
            name: 'galeries\'s name',
          });
          const {
            body,
            status,
          } = await putGaleriesId(app, token, id, {
            name: 'new galerie\'s name',
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
