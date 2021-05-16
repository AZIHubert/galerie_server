import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Invitation,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteGalerieIdInvitationId,
  login,
  postGalerie,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
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
              } = await postGaleriesIdInvitations(app, token, galerieId, {});
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    invitationId: returnedInvitationId,
                  },
                },
                status,
              } = await deleteGalerieIdInvitationId(app, token, galerieId, invitationId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(action).toBe('DELETE');
              expect(invitation).toBeNull();
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedInvitationId).toBe(invitationId);
              expect(status).toBe(200);
            });
          });
          describe('should return error 400 if', () => {
            it('user\'s role is \'user\' for this galerie', async () => {
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
                    invitation: {
                      id: invitationId,
                      code,
                    },
                  },
                },
              } = await postGaleriesIdInvitations(app, token, galerieId, {});
              await postGaleriesSubscribe(app, tokenTwo, { code });
              const {
                body,
                status,
              } = await deleteGalerieIdInvitationId(app, tokenTwo, galerieId, invitationId);
              expect(body.errors).toBe('your not allow to delete invitations');
              expect(status).toBe(400);
            });
          });
          describe('should return error 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGalerieIdInvitationId(app, token, '100', '100');
              expect(body.errors).toBe('galerie not found');
              expect(status).toBe(404);
            });
            it('galerie exist but user is not subscribe to it', async () => {
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
                    galerie: {
                      id,
                    },
                  },
                },
              } = await postGalerie(app, tokenTwo, {
                name: 'galeries\'name',
              });
              const {
                body,
                status,
              } = await deleteGalerieIdInvitationId(app, token, id, '100');
              expect(body.errors).toBe('galerie not found');
              expect(status).toBe(404);
            });
            it('invitation not found', async () => {
              const {
                body,
                status,
              } = await deleteGalerieIdInvitationId(app, token, galerieId, '100');
              expect(body.errors).toBe('invitation not found');
              expect(status).toBe(404);
            });
            it('invitation exist but does not belong to this galerie', async () => {
              const {
                body: {
                  data: {
                    galerie,
                  },
                },
              } = await postGalerie(app, token, {
                name: 'galerie\'s name',
              });
              const {
                body: {
                  data: {
                    invitation,
                  },
                },
              } = await postGaleriesIdInvitations(app, token, galerie.id, {});
              const {
                body,
                status,
              } = await deleteGalerieIdInvitationId(app, token, galerieId, invitation.id);
              expect(body.errors).toBe('invitation not found');
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
