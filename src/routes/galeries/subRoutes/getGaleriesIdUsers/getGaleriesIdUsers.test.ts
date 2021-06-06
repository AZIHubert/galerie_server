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
  getGaleriesIdUsers,
  postGaleries,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postProfilePictures,
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
    describe('/users', () => {
      describe('it should return status 200 and', () => {
        it('return no user', async () => {
          const {
            body: {
              action,
              data: {
                galerieId: returnedGalerieId,
                users,
              },
            },
            status,
          } = await getGaleriesIdUsers(app, token, galerieId);
          expect(action).toBe('GET');
          expect(returnedGalerieId).toBe(galerieId);
          expect(users.length).toBe(0);
          expect(status).toBe(200);
        });
        it('return 1 user', async () => {
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
          } = await postGaleriesIdInvitations(app, token, galerieId);
          await postGaleriesSubscribe(app, tokenTwo, {
            body: {
              code,
            },
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getGaleriesIdUsers(app, token, galerieId);
          expect(users.length).toBe(1);
          expect(users[0].authTokenVersion).toBeUndefined();
          expect(users[0].confirmed).toBeUndefined();
          expect(users[0].confirmTokenVersion).toBeUndefined();
          expect(users[0].createdAt).not.toBeUndefined();
          expect(users[0].currentProfilePicture).not.toBeUndefined();
          expect(users[0].defaultProfilePicture).not.toBeUndefined();
          expect(users[0].email).toBeUndefined();
          expect(users[0].emailTokenVersion).toBeUndefined();
          expect(users[0].facebookId).toBeUndefined();
          expect(users[0].galerieRole).not.toBeUndefined();
          expect(users[0].galeries).toBeUndefined();
          expect(users[0].googleId).toBeUndefined();
          expect(users[0].id).not.toBeUndefined();
          expect(users[0].password).toBeUndefined();
          expect(users[0].pseudonym).not.toBeUndefined();
          expect(users[0].resetPasswordTokenVersion).toBeUndefined();
          expect(users[0].role).not.toBeUndefined();
          expect(users[0].socialMediaUserName).not.toBeUndefined();
          expect(users[0].updatedAt).toBeUndefined();
          expect(users[0].updatedEmailTokenVersion).toBeUndefined();
          expect(users[0].userName).not.toBeUndefined();
        });
        it('return users with their current profile picture', async () => {
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
          } = await postGaleriesIdInvitations(app, token, galerieId);
          await postGaleriesSubscribe(app, tokenTwo, {
            body: {
              code,
            },
          });
          await postProfilePictures(app, tokenTwo);
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getGaleriesIdUsers(app, token, galerieId);
          expect(users[0].currentProfilePicture.createdAt).not.toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImageId).toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.bucketName).toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.createdAt).toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.fileName).toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.format).not.toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.height).not.toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.id).toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.size).not.toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
          expect(users[0].currentProfilePicture.cropedImage.width).not.toBeUndefined();
          expect(users[0].currentProfilePicture.current).toBeUndefined();
          expect(users[0].currentProfilePicture.id).not.toBeUndefined();
          expect(users[0].currentProfilePicture.originalImageId).toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.bucketName).toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.createdAt).toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.fileName).toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.format).not.toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.height).not.toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.id).toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.size).not.toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.updatedAt).toBeUndefined();
          expect(users[0].currentProfilePicture.originalImage.width).not.toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImageId).toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.bucketName).toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.createdAt).toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.fileName).toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.format).not.toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.height).not.toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.id).toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.size).not.toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
          expect(users[0].currentProfilePicture.pendingImage.width).not.toBeUndefined();
          expect(users[0].currentProfilePicture.updatedAt).toBeUndefined();
          expect(users[0].currentProfilePicture.userId).toBeUndefined();
        });
        it('should not return users if their not subscribe to this galerie', async () => {
          await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              data: {
                users,
              },
            },
          } = await getGaleriesIdUsers(app, token, galerieId);
          expect(users.length).toBe(0);
        });
        it('TODO: return a pack of 20 users', async () => {});
        it('TODO: don\'t return user if he\'s black listed and current user role for this galerie is \'user\'', async () => {});
        it('TODO: return user if he\'s black listed and current user role for this galerie is \'admin\'', async () => {});
        it('TODO: return user if he\'s black listed and current user role for this galerie is \'creator\'', async () => {});
        it('TODO: return user if he\'s black list and current user role for this galerie is \'user\' and role is \'admin\'', async () => {});
        it('TODO: return user if he\'s black list and current user role for this galerie is \'user\' and role is \'superAdmin\'', async () => {});
      });
      describe('should return status 400 if', () => {
        it('request.params.galerieId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await getGaleriesIdUsers(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('galerie'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('galerie doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await getGaleriesIdUsers(app, token, uuidv4());
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
                galerie,
              },
            },
          } = await postGaleries(app, tokenTwo, {
            body: {
              name: 'galerie\'s name',
            },
          });
          const {
            body,
            status,
          } = await getGaleriesIdUsers(app, token, galerie.id);
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
