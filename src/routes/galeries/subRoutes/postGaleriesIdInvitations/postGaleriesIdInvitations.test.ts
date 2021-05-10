import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { FIELD_NOT_A_NUMBER } from '@src/helpers/errorMessages';
import {
  Invitation,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postGalerie,
  postGaleriesIdInvitations,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('galeries', () => {
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
      user = await createUser({});
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

  describe(':id', () => {
    describe('invitations', () => {
      describe('POST', () => {
        describe('Should return status 200 and', () => {
          it('create an invit with time/numOfInvit === null', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  invitation,
                },
              },
              status,
            } = await postGaleriesIdInvitations(app, token, galerieId, {});
            const createdInvitation = await Invitation.findByPk(invitation.id);
            expect(action).toBe('POST');
            expect(createdInvitation).not.toBeNull();
            expect(invitation.code).not.toBeUndefined();
            expect(invitation.createdAt).not.toBeUndefined();
            expect(invitation.galerieId).toBeUndefined();
            expect(invitation.id).not.toBeUndefined();
            expect(invitation.numOfInvit).toBeNull();
            expect(invitation.time).toBeNull();
            expect(invitation.updatedAt).toBeUndefined();
            expect(invitation.user.authTokenVersion).toBeUndefined();
            expect(invitation.user.confirmed).toBeUndefined();
            expect(invitation.user.confirmTokenVersion).toBeUndefined();
            expect(invitation.createdAt).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture).toBeNull();
            expect(invitation.user.defaultProfilePicture).toBe(user.defaultProfilePicture);
            expect(invitation.user.email).toBeUndefined();
            expect(invitation.user.emailTokenVersion).toBeUndefined();
            expect(invitation.user.facebookId).toBeUndefined();
            expect(invitation.user.googleId).toBeUndefined();
            expect(invitation.user.id).toBe(user.id);
            expect(invitation.user.password).toBeUndefined();
            expect(invitation.user.pseudonym).toBe(user.pseudonym);
            expect(invitation.user.resetPasswordTokenVersion).toBeUndefined();
            expect(invitation.user.role).toBe(user.role);
            expect(invitation.user.socialMediaUserName).toBe(user.socialMediaUserName);
            expect(invitation.user.updatedAt).toBeUndefined();
            expect(invitation.user.updatedEmailTokenVersion).toBeUndefined();
            expect(invitation.user.userName).toBe(user.userName);
            expect(invitation.userId).toBeUndefined();
            expect(returnedGalerieId).toBe(galerieId);
            expect(status).toBe(200);
          });
          it('create an invit with time === null', async () => {
            const numOfInvit = 1;
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              numOfInvit,
            });
            expect(invitation.numOfInvit).toBe(numOfInvit);
            expect(invitation.time).toBeNull();
          });
          it('create an invit with numOfTime === null', async () => {
            const time = 1000 * 60 * 5;
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              time,
            });
            expect(invitation.numOfInvit).toBeNull();
            expect(invitation.time).toBe(time);
          });
          it('create an invit with time/numOfTime', async () => {
            const numOfInvit = 1;
            const time = 1000 * 60 * 5;
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {
              numOfInvit,
              time,
            });
            expect(invitation.numOfInvit).toBe(numOfInvit);
            expect(invitation.time).toBe(time);
          });
          it('should incude profile picture', async () => {
            await postProfilePicture(app, token);
            const {
              body: {
                data: {
                  invitation,
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {});
            expect(invitation.user.currentProfilePicture.createdAt).toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImageId).toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.bucketName).toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.fileName).toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.format).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.height).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.size).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(invitation.user.currentProfilePicture.cropedImage.width).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.current).toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImageId).toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.bucketName).toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.fileName).toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.format).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.height).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.id).toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.signedUrl)
              .not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.size).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(invitation.user.currentProfilePicture.originalImage.width).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.id).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImageId).toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.bucketName).toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.fileName).toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.format).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.height).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.signedUrl)
              .not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.size).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
            expect(invitation.user.currentProfilePicture.pendingImage.width).not.toBeUndefined();
            expect(invitation.user.currentProfilePicture.updatedAt).toBeUndefined();
            expect(invitation.user.currentProfilePicture.userId).toBeUndefined();
          });
        });
        describe('Should return status 400', () => {
          it('TODO: if user\'s role is \'user\'', async () => {});
          describe('if numOfInvit', () => {
            it('is not a number', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                numOfInvit: 'wrong field',
              });
              expect(body.errors).toEqual({
                numOfInvit: FIELD_NOT_A_NUMBER,
              });
              expect(status).toBe(400);
            });
            it('is less than 1', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                numOfInvit: 0,
              });
              expect(body.errors).toEqual({
                numOfInvit: 'should be at least 1',
              });
              expect(status).toBe(400);
            });
            it('is more than 200', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                numOfInvit: 201,
              });
              expect(body.errors).toEqual({
                numOfInvit: 'should be at most 200',
              });
              expect(status).toBe(400);
            });
          });
          describe('if time', () => {
            it('is not a number', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                time: 'wrong field',
              });
              expect(body.errors).toEqual({
                time: FIELD_NOT_A_NUMBER,
              });
              expect(status).toBe(400);
            });
            it('is less than 5 mn (1000 * 60 * 5)', async () => {
              const {
                body,
                status,
              } = await postGaleriesIdInvitations(app, token, galerieId, {
                time: (1000 * 60 * 5) - 1,
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
                time: (1000 * 60 * 60 * 24 * 365) + 1,
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
            } = await postGaleriesIdInvitations(app, token, '100', {});
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
              name: 'galeries\'s name',
            });
            const {
              body,
              status,
            } = await postGaleriesIdInvitations(app, token, id, {});
            expect(body.errors).toBe('galerie not found');
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
