import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Invitation,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteGaleriesIdInvitationId,
  postGaleries,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

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
      const {
        password,
        user: createdUser,
      } = await createUser({
        role: 'superAdmin',
      });

      user = createdUser;

      const { body } = await postUsersLogin(app, {
        body: {
          password,
          userNameOrEmail: user.email,
        },
      });
      token = body.token;
      const {
        body: {
          data: {
            galerie: {
              id,
            },
          },
        },
      } = await postGaleries(app, token, {
        body: {
          name: 'galerie\'s name',
        },
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
    describe('/invations', () => {
      describe('/:invitationId', () => {
        describe('DELETE', () => {
          describe('should return status 200 and', () => {
            it('destroy invitation', async () => {
              const {
                body: {
                  data: {
                    invitation: {
                      id: invitationId,
                    },
                  },
                },
              } = await postGaleriesIdInvitations(app, token, galerieId);
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    invitationId: returnedInvitationId,
                  },
                },
                status,
              } = await deleteGaleriesIdInvitationId(app, token, galerieId, invitationId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(action).toBe('DELETE');
              expect(invitation).toBeNull();
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedInvitationId).toBe(invitationId);
              expect(status).toBe(200);
            });
          });
          describe('should return status 400 if', () => {
            it('req.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('req.params.invitationId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('invitation'));
              expect(status).toBe(400);
            });
            it('user\'s role is \'user\' for this galerie', async () => {
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
                      id: invitationId,
                      code,
                    },
                  },
                },
              } = await postGaleriesIdInvitations(app, token, galerieId);
              await postGaleriesSubscribe(app, tokenTwo, {
                body: {
                  code,
                },
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, tokenTwo, galerieId, invitationId);
              expect(body.errors).toBe('your not allow to delete invitations');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, uuidv4(), uuidv4());
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
                body: {
                  name: 'galeries\'name',
                },
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('invitation not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
            it('invitation exist but does not belong to this galerie', async () => {
              const {
                body: {
                  data: {
                    galerie,
                  },
                },
              } = await postGaleries(app, token, {
                body: {
                  name: 'galerie\'s name',
                },
              });
              const {
                body: {
                  data: {
                    invitation,
                  },
                },
              } = await postGaleriesIdInvitations(app, token, galerie.id);
              const {
                body,
                status,
              } = await deleteGaleriesIdInvitationId(app, token, galerieId, invitation.id);
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
