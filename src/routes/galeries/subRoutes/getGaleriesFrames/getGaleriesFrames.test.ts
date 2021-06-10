import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Frame,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import signedUrl from '@src/helpers/signedUrl';
import {
  cleanGoogleBuckets,
  createUser,
  getGaleriesFrames,
  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postProfilePictures,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/frames', () => {
    describe('GET', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        jest.clearAllMocks();
        (signedUrl as jest.Mock).mockImplementation(() => ({
          OK: true,
          signedUrl: 'signedUrl',
        }));
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
        } catch (err) {
          done(err);
        }
        done();
      });

      afterAll(async (done) => {
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
        it('return no frame', async () => {
          const {
            body: {
              action,
              data: {
                frames,
              },
            },
            status,
          } = await getGaleriesFrames(app, token);
          expect(action).toBe('GET');
          expect(frames.length).toBe(0);
          expect(status).toBe(200);
        });
        it('return one frame', async () => {
          const {
            body: {
              data: {
                galerie: {
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, token, {
            body: {
              name: 'galerie\'s name',
            },
          });
          await postGaleriesIdFrames(app, token, galerieId);
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(frames.length).toBe(1);
        });
        it('return frames with relevent attributes', async () => {
          const {
            body: {
              data: {
                galerie: {
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, token, {
            body: {
              name: 'galerie\'s name',
            },
          });
          await postGaleriesIdFrames(app, token, galerieId);
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(frames[0].createdAt).not.toBeUndefined();
          expect(frames[0].description).not.toBeUndefined();
          expect(frames[0].galerieId).toBeUndefined();
          expect(frames[0].galeriePictures[0].current).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].createdAt).toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImage.createdAt).toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImage.format).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImage.height).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImage.id).toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImage.signedUrl).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImage.size).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImage.updatedAt).toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImage.width).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].cropedImageId).toBeUndefined();
          expect(frames[0].galeriePictures[0].id).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].index).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImage.createdAt).toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImage.format).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImage.height).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImage.id).toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImage.signedUrl).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImage.size).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImage.updatedAt).toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImage.width).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].originalImageId).toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImage.createdAt).toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImage.format).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImage.height).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImage.id).toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImage.signedUrl).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImage.size).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImage.updatedAt).toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImage.width).not.toBeUndefined();
          expect(frames[0].galeriePictures[0].pendingImageId).toBeUndefined();
          expect(frames[0].id).not.toBeUndefined();
          expect(frames[0].numOfLikes).not.toBeUndefined();
          expect(frames[0].updatedAt).toBeUndefined();
          expect(frames[0].user.authTokenVersion).toBeUndefined();
          expect(frames[0].user.confirmed).toBeUndefined();
          expect(frames[0].user.confirmTokenVersion).toBeUndefined();
          expect(frames[0].user.createdAt).not.toBeUndefined();
          expect(frames[0].user.defaultProfilePicture).not.toBeUndefined();
          expect(frames[0].user.email).toBeUndefined();
          expect(frames[0].user.emailTokenVersion).toBeUndefined();
          expect(frames[0].user.facebookId).toBeUndefined();
          expect(frames[0].user.googleId).toBeUndefined();
          expect(frames[0].user.id).not.toBeUndefined();
          expect(frames[0].user.hash).toBeUndefined();
          expect(frames[0].user.pseudonym).not.toBeUndefined();
          expect(frames[0].user.resetPasswordTokenVersion).toBeUndefined();
          expect(frames[0].user.role).not.toBeUndefined();
          expect(frames[0].user.salt).toBeUndefined();
          expect(frames[0].user.socialMediaUserName).not.toBeUndefined();
          expect(frames[0].user.updatedAt).toBeUndefined();
          expect(frames[0].user.updatedEmailTokenVersion).toBeUndefined();
          expect(frames[0].user.userName).not.toBeUndefined();
        });
        it('return frames with user with his current profile picture', async () => {
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
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, tokenTwo, {
            body: {
              name: 'galerie\'s name',
            },
          });
          await postGaleriesIdFrames(app, tokenTwo, galerieId);
          const {
            body: {
              data: {
                invitation: {
                  code,
                },
              },
            },
          } = await postGaleriesIdInvitations(app, tokenTwo, galerieId);
          await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          await postProfilePictures(app, tokenTwo);
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(frames[0].user.currentProfilePicture.createdAt).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImage.createdAt).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImage.format).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImage.height).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImage.id).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImage.size).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImage.width).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.cropedImageId).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.current).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.id).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImage.createdAt).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImage.format).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImage.height).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImage.id).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImage.signedUrl)
            .not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImage.size).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImage.updatedAt).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImage.width).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.originalImageId).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImage.createdAt).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImage.format).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImage.height).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImage.id).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImage.size).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImage.width).not.toBeUndefined();
          expect(frames[0].user.currentProfilePicture.pendingImageId).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.updatedAt).toBeUndefined();
          expect(frames[0].user.currentProfilePicture.userId).toBeUndefined();
        });
        it('return two frames from two different galeries', async () => {
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
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, tokenTwo, {
            body: {
              name: 'galerie\'s name',
            },
          });
          await postGaleriesIdFrames(app, tokenTwo, galerieId);
          const {
            body: {
              data: {
                invitation: {
                  code,
                },
              },
            },
          } = await postGaleriesIdInvitations(app, tokenTwo, galerieId);
          await postGaleriesSubscribe(app, token, {
            body: {
              code,
            },
          });
          const {
            body: {
              data: {
                galerie: {
                  id: galerieTwoId,
                },
              },
            },
          } = await postGaleries(app, token, {
            body: {
              name: 'galerie\'s name',
            },
          });
          await postGaleriesIdFrames(app, token, galerieTwoId);
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(frames.length).toBe(2);
        });
        it('return a pack of 20 frames', async () => {
          const NUMBER = 21;
          const numOfFrames = new Array(NUMBER).fill(0);
          const {
            body: {
              data: {
                galerie: {
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, token, {
            body: {
              name: 'galerie\'s name',
            },
          });
          await Promise.all(
            numOfFrames.map(async () => {
              const {
                id: frameId,
              } = await Frame.create({
                galerieId,
                userId: user.id,
              });
              const {
                id: imageId,
              } = await Image.create({
                bucketName: 'bucketName',
                fileName: 'fileName',
                format: 'format',
                height: 10,
                size: 10,
                width: 10,
              });
              await GaleriePicture.create({
                cropedImageId: imageId,
                current: false,
                frameId,
                originalImageId: imageId,
                pendingImageId: imageId,
              });
            }),
          );
          const {
            body: {
              data: {
                frames: firstPack,
              },
            },
          } = await getGaleriesFrames(app, token);
          const {
            body: {
              data: {
                frames: secondPack,
              },
            },
          } = await getGaleriesFrames(app, token, { page: 2 });
          expect(firstPack.length).toBe(20);
          expect(secondPack.length).toBe(1);
        });
        it('don\'t return frame of galerie where user is not subscribed', async () => {
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
                  id: galerieId,
                },
              },
            },
          } = await postGaleries(app, tokenTwo, {
            body: {
              name: 'galerie\'s name',
            },
          });
          await postGaleriesIdFrames(app, tokenTwo, galerieId);
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(frames.length).toBe(0);
        });
        it('return frames ordered by createdAt', async () => {
          const {
            body: {
              data: {
                galerie: {
                  id: galerieId,
                },
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
                frame: frameOne,
              },
            },
          } = await postGaleriesIdFrames(app, token, galerieId);
          const {
            body: {
              data: {
                frame: frameTwo,
              },
            },
          } = await postGaleriesIdFrames(app, token, galerieId);
          const {
            body: {
              data: {
                frame: frameThree,
              },
            },
          } = await postGaleriesIdFrames(app, token, galerieId);
          const {
            body: {
              data: {
                frame: frameFour,
              },
            },
          } = await postGaleriesIdFrames(app, token, galerieId);
          const {
            body: {
              data: {
                frames,
              },
            },
          } = await getGaleriesFrames(app, token);
          expect(frames[0].id).toBe(frameFour.id);
          expect(frames[1].id).toBe(frameThree.id);
          expect(frames[2].id).toBe(frameTwo.id);
          expect(frames[3].id).toBe(frameOne.id);
        });
      });
    });
  });
});
