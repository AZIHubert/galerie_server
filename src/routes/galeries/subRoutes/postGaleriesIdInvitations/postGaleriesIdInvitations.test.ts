import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  FIELD_SHOULD_BE_A_NUMBER,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  Invitation,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import signedUrl from '@src/helpers/signedUrl';
import {
  cleanGoogleBuckets,
  createGalerie,
  createGalerieUser,
  createProfilePicture,
  createUser,
  postGaleriesIdInvitations,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/invitations', () => {
      describe('POST', () => {
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
            } = await createUser({});
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

        describe('Should return status 200 and', () => {
          it('create an invit with time/numOfInvits === null', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  invitation: returnedInvitation,
                },
              },
              status,
            } = await postGaleriesIdInvitations(app, token, galerieId);
            const createdInvitation = await Invitation.findByPk(returnedInvitation.id);
            expect(action).toBe('POST');
            expect(createdInvitation).not.toBeNull();
            expect(returnedInvitation.code).not.toBeUndefined();
            expect(returnedInvitation.createdAt).not.toBeUndefined();
            expect(returnedInvitation.galerieId).toBeUndefined();
            expect(returnedInvitation.id).not.toBeUndefined();
            expect(returnedInvitation.numOfInvits).toBeNull();
            expect(returnedInvitation.time).toBeNull();
            expect(returnedInvitation.updatedAt).toBeUndefined();
            testUser(returnedInvitation.user);
            expect(returnedInvitation.userId).toBeUndefined();
            expect(returnedGalerieId).toBe(galerieId);
            expect(status).toBe(200);
          });
          it('create an invit with numOfInvits', async () => {
            const numOfInvits = 1;
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              body: {
                numOfInvits,
              },
            });
            expect(invitation.numOfInvits).toBe(numOfInvits);
            expect(invitation.time).toBeNull();
          });
          it('create an invit with time', async () => {
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              body: {
                time,
              },
            });
            expect(invitation.numOfInvits).toBeNull();
            expect(new Date(invitation.time)).toEqual(new Date(timeStamp + time));
          });
          it('create an invit with time && numOfTime', async () => {
            const numOfInvits = 1;
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              body: {
                numOfInvits,
                time,
              },
            });
            expect(invitation.numOfInvits).toBe(numOfInvits);
            expect(new Date(invitation.time)).toEqual(new Date(timeStamp + time));
          });
          it('should incude profile picture', async () => {
            await createProfilePicture({
              userId: user.id,
            });
            const {
              body: {
                data: {
                  invitation: {
                    user: {
                      currentProfilePicture,
                    },
                  },
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId);
            expect(currentProfilePicture.createdAt).not.toBeUndefined();
            expect(currentProfilePicture.cropedImageId).toBeUndefined();
            expect(currentProfilePicture.cropedImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.fileName).toBeUndefined();
            expect(currentProfilePicture.cropedImage.format).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.height).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.size).not.toBeUndefined();
            expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.width).not.toBeUndefined();
            expect(currentProfilePicture.current).toBeUndefined();
            expect(currentProfilePicture.originalImageId).toBeUndefined();
            expect(currentProfilePicture.originalImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.fileName).toBeUndefined();
            expect(currentProfilePicture.originalImage.format).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.height).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.id).toBeUndefined();
            expect(currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.size).not.toBeUndefined();
            expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.width).not.toBeUndefined();
            expect(currentProfilePicture.id).not.toBeUndefined();
            expect(currentProfilePicture.pendingImageId).toBeUndefined();
            expect(currentProfilePicture.pendingImage.bucketName).toBeUndefined();
            expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.fileName).toBeUndefined();
            expect(currentProfilePicture.pendingImage.format).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.height).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.size).not.toBeUndefined();
            expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.width).not.toBeUndefined();
            expect(currentProfilePicture.updatedAt).toBeUndefined();
            expect(currentProfilePicture.userId).toBeUndefined();
          });
        });
        describe('Should return status 400 if', () => {
          it('request.params.galerieId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await postGaleriesIdInvitations(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
          it('user\'s role is \'user\'', async () => {
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
            } = await postGaleriesIdInvitations(app, tokenTwo, galerieId);
            expect(body.errors).toBe('you\'re not allow to create an invitation');
            expect(status).toBe(400);
          });
          it('galerie is archived', async () => {
            const galerieTwo = await createGalerie({
              archived: true,
              userId: user.id,
            });
            const {
              body,
              status,
            } = await postGaleriesIdInvitations(app, token, galerieTwo.id);
            expect(body.errors).toBe('you cannot post invitation on an archived galerie');
            expect(status).toBe(400);
          });
          describe('numOfInvits', () => {
            it('is not a number', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                body: {
                  numOfInvits: 'wrong field',
                },
              });
              expect(body.errors).toEqual({
                numOfInvits: FIELD_SHOULD_BE_A_NUMBER,
              });
              expect(status).toBe(400);
            });
            it('is less than 1', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                body: {
                  numOfInvits: 0,
                },
              });
              expect(body.errors).toEqual({
                numOfInvits: 'should be at least 1',
              });
              expect(status).toBe(400);
            });
            it('is more than 200', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                body: {
                  numOfInvits: 201,
                },
              });
              expect(body.errors).toEqual({
                numOfInvits: 'should be at most 200',
              });
              expect(status).toBe(400);
            });
          });
          describe('time', () => {
            it('is not a number', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                body: {
                  time: 'wrong field',
                },
              });
              expect(body.errors).toEqual({
                time: FIELD_SHOULD_BE_A_NUMBER,
              });
              expect(status).toBe(400);
            });
            it('is less than 5 mn (1000 * 60 * 5)', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                body: {
                  time: (1000 * 60 * 5) - 1,
                },
              });
              expect(body.errors).toEqual({
                time: 'should be at least 5mn',
              });
              expect(status).toBe(400);
            });
            it('is more than 1 year (1000 * 60 * 60 * 24 * 365)', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                body: {
                  time: (1000 * 60 * 60 * 24 * 365) + 1,
                },
              });
              expect(body.errors).toEqual({
                time: 'should be at most 1 year',
              });
              expect(status).toBe(400);
            });
          });
        });
        describe('Should return status 404 if', () => {
          it('galeries not found', async () => {
            const {
              body,
              status,
            } = await postGaleriesIdInvitations(app, token, uuidv4());
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
            } = await postGaleriesIdInvitations(app, token, galerieTwo.id);
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
