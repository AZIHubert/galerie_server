import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postGalerie,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  putGaleriesIdUsersId,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/galeries', () => {
  let app: Server;
  let galerieId: string;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });
      user = await createUser({
        role: 'superAdmin',
      });
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
      const {
        body: {
          data: {
            galerie: {
              id,
            },
          },
        },
      } = await postGalerie(app, token, {
        name: 'galerie\'s name',
      });
      galerieId = id;
    } catch (err) {
      done(err);
    }
    done();
  });

  afterAll(async (done) => {
    try {
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('/:galerieId', () => {
    describe('/users', () => {
      describe('/:userId', () => {
        describe('PUT', () => {
          describe('should return status 200 and', () => {
            let userTwo: User;
            let tokenTwo: string;
            beforeEach(async (done) => {
              try {
                const {
                  body: {
                    data: {
                      invitation: {
                        code,
                      },
                    },
                  },
                } = await postGaleriesIdInvitations(app, token, galerieId, {});
                userTwo = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body,
                } = await login(app, userTwo.email, userPassword);
                tokenTwo = body.token;
                await postGaleriesSubscribe(app, tokenTwo, { code });
              } catch (err) {
                done(err);
              }
              done();
            });
            it('and update user\'s role to admin if previous role was user', async () => {
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    role,
                    userId: returnedUserId,
                  },
                },
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(action).toBe('PUT');
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedUserId).toBe(userTwo.id);
              expect(role).toBe('admin');
              expect(status).toBe(200);
            });
            it('update user\'s role to user if previous role was admin', async () => {
              await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const {
                body: {
                  data: {
                    role,
                  },
                },
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(role).toBe('user');
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.params.userId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('user'));
              expect(status).toBe(400);
            });
            it('userId and current user id are the same', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, user.id);
              expect(body.errors).toBe('you cannot change your role yourself');
              expect(status).toBe(400);
            });
            it('current user role for this galerie is \'user\'', async () => {
              const {
                body: {
                  data: {
                    invitation: {
                      code,
                    },
                  },
                },
              } = await postGaleriesIdInvitations(app, token, galerieId, {});
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await login(app, userTwo.email, userPassword);
              await postGaleriesSubscribe(app, tokenTwo, { code });
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you should be an admin or the creator to update the role of a user');
              expect(status).toBe(400);
            });
            it('user\'s role is creator', async () => {
              const {
                body: {
                  data: {
                    invitation: {
                      code,
                    },
                  },
                },
              } = await postGaleriesIdInvitations(app, token, galerieId, {});
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await login(app, userTwo.email, userPassword);
              await postGaleriesSubscribe(app, tokenTwo, { code });
              await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you can\'t change the role of the creator of this galerie');
              expect(status).toBe(400);
            });
            it('user\'s role is admin and current user role is admin', async () => {
              const {
                body: {
                  data: {
                    invitation: {
                      code,
                    },
                  },
                },
              } = await postGaleriesIdInvitations(app, token, galerieId, {});
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const userThree = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await login(app, userTwo.email, userPassword);
              const {
                body: {
                  token: tokenThree,
                },
              } = await login(app, userThree.email, userPassword);
              await postGaleriesSubscribe(app, tokenTwo, { code });
              await postGaleriesSubscribe(app, tokenThree, { code });
              await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              await putGaleriesIdUsersId(app, token, galerieId, userThree.id);
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, tokenTwo, galerieId, userThree.id);
              expect(body.errors).toBe('you should be the creator of this galerie to update the role of an admin');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('galerie exist but current user is not subscribe to it', async () => {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await login(app, userTwo.email, userPassword);
              const {
                body: {
                  data: {
                    galerie,
                  },
                },
              } = await postGalerie(app, tokenTwo, {
                name: 'galerie\'s name',
              });
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerie.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('user not found', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
            it('user exist but is not subscribe to this galerie', async () => {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
