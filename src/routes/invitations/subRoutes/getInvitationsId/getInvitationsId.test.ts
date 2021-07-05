import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Invitation,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBlackList,
  createGalerie,
  createGalerieUser,
  createInvitation,
  createUser,
  getInvitationsId,
  testInvitation,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('#src/helpers/signedUrl', () => jest.fn());

describe('/galeries', () => {
  describe('/:id', () => {
    describe('/invitations', () => {
      describe('/:invitationId', () => {
        describe('GET', () => {
          beforeAll(() => {
            sequelize = initSequelize();
            app = initApp();
          });

          beforeEach(async (done) => {
            mockDate.reset();
            try {
              await sequelize.sync({ force: true });
              const {
                user: createdUser,
              } = await createUser({
                role: 'admin',
              });
              user = createdUser;
              const jwt = signAuthToken(user);
              token = jwt.token;
              const galerie = await createGalerie({
                userId: user.id,
              });
              galerieId = galerie.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          afterAll(async (done) => {
            mockDate.reset();
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
            it('return the invitation', async () => {
              const invitation = await createInvitation({
                galerieId,
                userId: user.id,
              });
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    invitation: returnedInvitation,
                  },
                },
                status,
              } = await getInvitationsId(app, token, invitation.id);
              expect(action).toBe('GET');
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedInvitation.user.hasNewNotifications).toBeUndefined();
              expect(status).toBe(200);
              testInvitation(returnedInvitation, invitation);
              testUser(returnedInvitation.user, user);
            });
            it('return invitation if it\'s not expired', async () => {
              const timeStamp = 1434319925275;
              const time = 1000 * 60 * 10;
              mockDate.set(timeStamp);
              const { id: invitationId } = await createInvitation({
                galerieId,
                time,
                userId: user.id,
              });
              const {
                body: {
                  data: {
                    invitation,
                  },
                },
              } = await getInvitationsId(app, token, invitationId);
              expect(invitation).not.toBeNull();
            });
            it('return invitation if numOfInvits > 0', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                numOfInvits: 1,
                userId: user.id,
              });
              const {
                body: {
                  data: {
                    invitation,
                  },
                },
              } = await getInvitationsId(app, token, invitationId);
              expect(invitation).not.toBeNull();
            });
            it('return invitation.user.isBlackListed === true if he\'s black listed', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userTwo.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              await createBlackList({
                createdById: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    invitation: {
                      user: {
                        isBlackListed,
                      },
                    },
                  },
                },
              } = await getInvitationsId(app, token, invitationId);
              expect(isBlackListed).toBe(true);
            });
            it('return invitation.user.isBlackListed === false if his blackList is expired', async () => {
              const timeStamp = 1434319925275;
              const time = 1000 * 60 * 10;
              mockDate.set(timeStamp);
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userTwo.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              await createBlackList({
                createdById: user.id,
                time,
                userId: userTwo.id,
              });
              mockDate.set(timeStamp + time + 1);
              const {
                body: {
                  data: {
                    invitation: {
                      user: {
                        isBlackListed,
                      },
                    },
                  },
                },
              } = await getInvitationsId(app, token, invitationId);
              await userTwo.reload();
              expect(isBlackListed).toBe(false);
              expect(userTwo.isBlackListed).toBe(false);
            });
          });
          describe('should return error 400 if', () => {
            it('user\'s role of this galerie is \'user\'', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: user.id,
              });
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await getInvitationsId(app, tokenTwo, invitationId);
              expect(body.errors).toBe('you\'re not allow to fetch the invitation');
              expect(status).toBe(400);
            });
          });
          describe('should return status 400', () => {
            it('request.params.invitationId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await getInvitationsId(app, token, '100');
              expect(body.errors).toBe(INVALID_UUID('invitation'));
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('invitation is expired', async () => {
              const timeStamp = 1434319925275;
              const time = 1000 * 60 * 10;
              mockDate.set(timeStamp);
              const { id: invitationId } = await createInvitation({
                galerieId,
                time,
                userId: user.id,
              });
              mockDate.set(timeStamp + time + 1);
              const {
                body,
                status,
              } = await getInvitationsId(app, token, invitationId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(invitation).toBeNull();
              expect(status).toBe(404);
            });
            it('invitation.numOfInvits < 0', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                numOfInvits: 0,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await getInvitationsId(app, token, invitationId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(invitation).toBeNull();
              expect(status).toBe(404);
            });
            it('invitation doesn\'t exist', async () => {
              const {
                body,
                status,
              } = await getInvitationsId(app, token, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
            it('invitation exist but user is not subscribe to the galerie where it was post', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const galerieTwo = await createGalerie({
                userId: userTwo.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await getInvitationsId(app, token, invitationId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
