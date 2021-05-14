import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postGalerie,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  putGaleriesIdUsersId,
  postProfilePicture,
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

  describe('/:id', () => {
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
                    user: returnedUser,
                  },
                },
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(action).toBe('PUT');
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedUser.authTokenVersion).toBeUndefined();
              expect(returnedUser.confirmed).toBeUndefined();
              expect(returnedUser.confirmTokenVersion).toBeUndefined();
              expect(returnedUser.currentProfilePicture).not.toBeUndefined();
              expect(returnedUser.defaultProfilePicture).toBe(userTwo.defaultProfilePicture);
              expect(returnedUser.email).toBeUndefined();
              expect(returnedUser.emailTokenVersion).toBeUndefined();
              expect(returnedUser.facebookId).toBeUndefined();
              expect(returnedUser.googleId).toBeUndefined();
              expect(returnedUser.galerieRole).toBe('admin');
              expect(returnedUser.id).toBe(userTwo.id);
              expect(returnedUser.password).toBeUndefined();
              expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
              expect(returnedUser.role).toBe(userTwo.role);
              expect(returnedUser.socialMediaUserName).toBe(userTwo.socialMediaUserName);
              expect(returnedUser.updatedAt).toBeUndefined();
              expect(returnedUser.updatedEmailTokenVersion).toBeUndefined();
              expect(status).toBe(200);
            });
            it('update user\'s role to user if previous role was admin', async () => {
              await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const {
                body: {
                  data: {
                    user: {
                      galerieRole,
                    },
                  },
                },
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(galerieRole).toBe('user');
            });
            it('return user with his current profile picture', async () => {
              await postProfilePicture(app, tokenTwo);
              await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const {
                body: {
                  data: {
                    user: {
                      currentProfilePicture,
                    },
                  },
                },
              } = await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(currentProfilePicture.createdAt).toBeUndefined();
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
              expect(currentProfilePicture.id).not.toBeUndefined();
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
          describe('should return status 400 if', () => {
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
              } = await putGaleriesIdUsersId(app, token, '100', '100');
              expect(body.errors).toBe('galerie not found');
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
              } = await putGaleriesIdUsersId(app, token, galerie.id, '100');
              expect(body.errors).toBe('galerie not found');
              expect(status).toBe(404);
            });
            it('user not found', async () => {
              const {
                body,
                status,
              } = await putGaleriesIdUsersId(app, token, galerieId, '100');
              expect(body.errors).toBe('user not found');
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
              expect(body.errors).toBe('user not found');
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
