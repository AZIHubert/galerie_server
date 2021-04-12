import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GaleriePicture,
  GalerieUser,
  Image,
  Invitation,
  ProfilePicture,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteUser,
  login,
  postFrame,
  postGalerie,
  postInvitation,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const userPassword = 'Password0!';

describe('users', () => {
  let app: Server;
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
      user = await createUser({});
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
    } catch (err) {
      done(err);
    }
    done();
  });

  afterAll(async (done) => {
    try {
      await sequelize.sync({ force: true });
      await cleanGoogleBuckets();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('me', () => {
    // TODO:
    it('don\'t delete other galeries', () => {});
    it('delete galerieUsers and frames/invitations post by this deleted user on other galeries', () => {});
    it('doesn\'t delete frames posted by other users', () => {});
    it('should destroy all likes', () => {});

    describe('DELETE', () => {
      describe('should return status 204 and', () => {
        it('delete user', async () => {
          const { status } = await deleteUser(app, token, {
            deleteAccountSentence: 'delete my account',
            password: userPassword,
            userNameOrEmail: user.email,
          });
          const users = await User.findAll();
          expect(status).toBe(204);
          expect(users.length).toBe(0);
        });

        it('delete all frames/galeries/images/invitations/profile pictures', async () => {
          await postProfilePicture(app, token);
          const {
            body: {
              galerie: {
                id: galerieId,
              },
            },
          } = await postGalerie(app, token, {});
          await postFrame(app, token, galerieId);
          await postInvitation(app, token, galerieId);
          await deleteUser(app, token, {
            deleteAccountSentence: 'delete my account',
            password: userPassword,
            userNameOrEmail: user.email,
          });
          const [bucketCropedImages] = await gc
            .bucket(GALERIES_BUCKET_PP_CROP)
            .getFiles();
          const [bucketOriginalImages] = await gc
            .bucket(GALERIES_BUCKET_PP)
            .getFiles();
          const [bucketPendingImages] = await gc
            .bucket(GALERIES_BUCKET_PP_PENDING)
            .getFiles();
          const frames = await Frame.findAll();
          const galeries = await Galerie.findAll();
          const galeriePictures = await GaleriePicture.findAll();
          const galerieUsers = await GalerieUser.findAll();
          const images = await Image.findAll();
          const invitations = await Invitation.findAll();
          const profilePictures = await ProfilePicture.findAll();
          expect(bucketCropedImages.length).toBe(0);
          expect(bucketOriginalImages.length).toBe(0);
          expect(bucketPendingImages.length).toBe(0);
          expect(frames.length).toEqual(0);
          expect(galeries.length).toEqual(0);
          expect(galeriePictures.length).toEqual(0);
          expect(galerieUsers.length).toEqual(0);
          expect(images.length).toBe(0);
          expect(invitations.length).toEqual(0);
          expect(profilePictures.length).toBe(0);
        });

        it('don\'t delete other profile pictures', async () => {
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await login(app, userTwo.email, userPassword);
          await postProfilePicture(app, tokenTwo);
          await deleteUser(app, token, {
            deleteAccountSentence: 'delete my account',
            password: userPassword,
            userNameOrEmail: user.email,
          });
          const [bucketCropedImages] = await gc
            .bucket(GALERIES_BUCKET_PP_CROP)
            .getFiles();
          const [bucketOriginalImages] = await gc
            .bucket(GALERIES_BUCKET_PP)
            .getFiles();
          const [bucketPendingImages] = await gc
            .bucket(GALERIES_BUCKET_PP_PENDING)
            .getFiles();
          const images = await Image.findAll();
          const profilePictures = await ProfilePicture.findAll();
          expect(bucketCropedImages.length).toBe(1);
          expect(bucketOriginalImages.length).toBe(1);
          expect(bucketPendingImages.length).toBe(1);
          expect(images.length).toBe(3);
          expect(profilePictures.length).toBe(1);
        });

        it('should archive galeries if one other user is still subscribe to it', async () => {
          const {
            body: {
              galerie: {
                id: galerieId,
              },
            },
          } = await postGalerie(app, token, {});
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await GalerieUser.create({
            galerieId,
            role: 'user',
            userId: userTwo.id,
          });
          await deleteUser(app, token, {
            deleteAccountSentence: 'delete my account',
            password: userPassword,
            userNameOrEmail: user.email,
          });
          const galerie = await Galerie.findByPk(galerieId) as Galerie;
          const galerieUsers = await GalerieUser.findAll();
          expect(galerie.archived).toBeTruthy();
          expect(galerieUsers.length).toEqual(1);
        });

        it('should destroy all invitations if a galerie is archived', async () => {
          const {
            body: {
              galerie: {
                id: galerieId,
              },
            },
          } = await postGalerie(app, token, {});
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await GalerieUser.create({
            userId: userTwo.id,
            galerieId,
            role: 'user',
          });
          const {
            body: {
              token: tokenTwo,
            },
          } = await login(app, userTwo.email, userPassword);
          await postInvitation(app, tokenTwo, galerieId);
          await deleteUser(app, token, {
            deleteAccountSentence: 'delete my account',
            password: userPassword,
            userNameOrEmail: user.email,
          });
          const invitations = await Invitation.findAll();
          expect(invitations.length).toEqual(0);
        });
      });
      describe('should return status 400 if', () => {
        describe('deleteAccountSentence', () => {
          it('is not send', async () => {
            const { body, status } = await deleteUser(app, token, {
              password: userPassword,
              userNameOrEmail: user.email,
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                deleteAccountSentence: FIELD_IS_REQUIRED,
              },
            });
          });

          it('not match', async () => {
            const { body, status } = await deleteUser(app, token, {
              deleteAccountSentence: 'wrong sentence',
              password: userPassword,
              userNameOrEmail: user.email,
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                deleteAccountSentence: 'wrong sentence',
              },
            });
          });
        });

        describe('password', () => {
          it('is not send', async () => {
            const { body, status } = await deleteUser(app, token, {
              deleteAccountSentence: 'delete my account',
              userNameOrEmail: user.email,
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_REQUIRED,
              },
            });
          });

          it('not match', async () => {
            const { body, status } = await deleteUser(app, token, {
              deleteAccountSentence: 'delete my account',
              password: 'wrong password',
              userNameOrEmail: user.email,
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: WRONG_PASSWORD,
              },
            });
          });
        });

        describe('userNameOrEmail', () => {
          it('is not send', async () => {
            const { body, status } = await deleteUser(app, token, {
              deleteAccountSentence: 'delete my account',
              password: userPassword,
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                userNameOrEmail: FIELD_IS_REQUIRED,
              },
            });
          });
          it('not match', async () => {
            const { body, status } = await deleteUser(app, token, {
              deleteAccountSentence: 'delete my account',
              password: userPassword,
              userNameOrEmail: 'wrong email',
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                userNameOrEmail: 'wrong user name or email',
              },
            });
          });
        });
      });
    });
  });
});
