import { Server } from 'http';
import mockDate from 'mockdate';
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
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  cleanGoogleBuckets,
  createBlackList,
  createGalerie,
  createGalerieUser,
  createInvitation,
  createProfilePicture,
  createUser,
  getGaleriesIdInvitationsId,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('@src/helpers/signedUrl', () => jest.fn());

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
            jest.clearAllMocks();
            (signedUrl as jest.Mock).mockImplementation(() => ({
              OK: true,
              signedUrl: 'signedUrl',
            }));
            try {
              await cleanGoogleBuckets();
              await sequelize.sync({ force: true });
              const {
                user: createdUser,
              } = await createUser({
                role: 'superAdmin',
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
            jest.clearAllMocks();
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
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitation.id);
              expect(action).toBe('GET');
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedInvitation.code).toBe(invitation.code);
              expect(new Date(returnedInvitation.createdAt)).toEqual(invitation.createdAt);
              expect(returnedInvitation.galerieId).toBeUndefined();
              expect(returnedInvitation.id).toBe(invitation.id);
              expect(returnedInvitation.numOfInvits).toBe(invitation.numOfInvits);
              expect(returnedInvitation.time).toBe(invitation.time);
              expect(returnedInvitation.updatedAt).toBeUndefined();
              testUser(returnedInvitation.user, user);
              expect(returnedInvitation.userId).toBeUndefined();
              expect(status).toBe(200);
            });
            it('return user\'s profile picture', async () => {
              await createProfilePicture({
                userId: user.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: user.id,
              });
              const {
                body: {
                  data: {
                    invitation: returnedInvitation,
                  },
                },
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
              expect(returnedInvitation.user.currentProfilePicture.createdAt).not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImageId).toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.bucketName)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.createdAt)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.fileName)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.format)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.id).toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.signedUrl)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.size)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.updatedAt)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.cropedImage.width)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.current).toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.id).not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImageId).toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.bucketName)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.createdAt)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.fileName)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.format)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.id)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.signedUrl)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.size)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.updatedAt)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.originalImage.width)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImageId).toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.bucketName)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.createdAt)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.fileName)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.format)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.id).toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.signedUrl)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.size)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.updatedAt)
                .toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.pendingImage.width)
                .not.toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.updatedAt).toBeUndefined();
              expect(returnedInvitation.user.currentProfilePicture.userId).toBeUndefined();
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
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
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
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
              expect(invitation).not.toBeNull();
            });
            it('does invitation.user === null if he\'s black listed', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              await createGalerieUser({
                galerieId,
                role: 'admin',
                userId: userTwo.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              await createBlackList({
                adminId: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    invitation: {
                      user: invitationUser,
                    },
                  },
                },
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
              expect(invitationUser).toBeNull();
            });
            it('return user if his blackList is expired', async () => {
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
                role: 'admin',
                userId: userTwo.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              await createBlackList({
                adminId: user.id,
                time,
                userId: userTwo.id,
              });
              mockDate.set(timeStamp + time + 1);
              const {
                body: {
                  data: {
                    invitation: {
                      user: invitationUser,
                    },
                  },
                },
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
              await userTwo.reload();
              expect(invitationUser).not.toBeNull();
              expect(userTwo.blackListedAt).toBeNull();
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
              } = await getGaleriesIdInvitationsId(app, tokenTwo, galerieId, invitationId);
              expect(body.errors).toBe('you\'re not allow to fetch the invitation');
              expect(status).toBe(400);
            });
          });
          describe('should return status 400', () => {
            it('request.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdInvitationsId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.params.invitationId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdInvitationsId(app, token, uuidv4(), '100');
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
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
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
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(invitation).toBeNull();
              expect(status).toBe(404);
            });
            it('galerie doesn\'t exist', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdInvitationsId(app, token, uuidv4(), uuidv4());
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
              const galerieTwo = await createGalerie({
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await getGaleriesIdInvitationsId(app, token, galerieTwo.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('invitation doesn\'t exist', async () => {
              const {
                body,
                status,
              } = await getGaleriesIdInvitationsId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
            it('invitation exist but does not belong to galerie', async () => {
              const galerieTwo = await createGalerie({
                userId: user.id,
              });
              const { id: invitationId } = await createInvitation({
                galerieId: galerieTwo.id,
                userId: user.id,
              });
              const {
                body,
                status,
              } = await getGaleriesIdInvitationsId(app, token, galerieId, invitationId);
              expect(body.errors).toBe(MODEL_NOT_FOUND('invitation'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
