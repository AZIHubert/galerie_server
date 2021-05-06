import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Frame,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  FILES_ARE_REQUIRED,
  FILE_IS_IMAGE,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postGalerie,
  postGaleriesIdFrames,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');
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

  describe(':id', () => {
    describe('frames', () => {
      describe('POST', () => {
        describe('should return status 200 and', () => {
          it('create a frame width 1 images', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId);
            const createdFrames = await Frame.findAll({
              where: {
                galerieId,
              },
            });
            const createdGaleriePicture = await GaleriePicture.findAll({
              where: {
                frameId: createdFrames[0].id,
              },
            });
            const createdCropedImage = await Image
              .findByPk(createdGaleriePicture[0].cropedImageId);
            const createdOriginalImage = await Image
              .findByPk(createdGaleriePicture[0].originalImageId);
            const createdPendingImage = await Image
              .findByPk(createdGaleriePicture[0].pendingImageId);
            const [bucketCropedImages] = await gc
              .bucket(GALERIES_BUCKET_PP_CROP)
              .getFiles();
            const [bucketOriginalImages] = await gc
              .bucket(GALERIES_BUCKET_PP)
              .getFiles();
            const [bucketPendingImages] = await gc
              .bucket(GALERIES_BUCKET_PP_PENDING)
              .getFiles();
            expect(action).toBe('POST');
            expect(bucketCropedImages.length).toBe(1);
            expect(bucketOriginalImages.length).toBe(1);
            expect(bucketPendingImages.length).toBe(1);
            expect(createdCropedImage).not.toBeNull();
            expect(createdFrames.length).toBe(1);
            expect(createdGaleriePicture.length).toBe(1);
            expect(createdOriginalImage).not.toBeNull();
            expect(createdPendingImage).not.toBeNull();
            expect(frame.createdAt).toBeTruthy();
            expect(frame.galerieId).toBeUndefined();
            expect(frame.galeriePictures.length).toBe(1);
            expect(frame.galeriePictures[0].coverPicture).toBeFalsy();
            expect(frame.galeriePictures[0].createdAt).toBeUndefined();
            expect(frame.galeriePictures[0].cropedImage.bucketName).toBeUndefined();
            expect(frame.galeriePictures[0].cropedImage.createdAt).toBeUndefined();
            expect(frame.galeriePictures[0].cropedImage.fileName).toBeUndefined();
            expect(frame.galeriePictures[0].cropedImage.format).toBeTruthy();
            expect(frame.galeriePictures[0].cropedImage.height).toBeTruthy();
            expect(frame.galeriePictures[0].cropedImage.id).toBeUndefined();
            expect(frame.galeriePictures[0].cropedImage.size).toBeTruthy();
            expect(frame.galeriePictures[0].cropedImage.signedUrl).toBeTruthy();
            expect(frame.galeriePictures[0].cropedImage.updatedAt).toBeUndefined();
            expect(frame.galeriePictures[0].cropedImage.width).toBeTruthy();
            expect(frame.galeriePictures[0].cropedImagesId).toBeUndefined();
            expect(frame.galeriePictures[0].id).toBeTruthy();
            expect(frame.galeriePictures[0].index).toBe(0);
            expect(frame.galeriePictures[0].originalImage.bucketName).toBeUndefined();
            expect(frame.galeriePictures[0].originalImage.createdAt).toBeUndefined();
            expect(frame.galeriePictures[0].originalImage.fileName).toBeUndefined();
            expect(frame.galeriePictures[0].originalImage.format).toBeTruthy();
            expect(frame.galeriePictures[0].originalImage.height).toBeTruthy();
            expect(frame.galeriePictures[0].originalImage.id).toBeUndefined();
            expect(frame.galeriePictures[0].originalImage.size).toBeTruthy();
            expect(frame.galeriePictures[0].originalImage.signedUrl).toBeTruthy();
            expect(frame.galeriePictures[0].originalImage.updatedAt).toBeUndefined();
            expect(frame.galeriePictures[0].originalImage.width).toBeTruthy();
            expect(frame.galeriePictures[0].originalImageId).toBeUndefined();
            expect(frame.galeriePictures[0].pendingImage.bucketName).toBeUndefined();
            expect(frame.galeriePictures[0].pendingImage.createdAt).toBeUndefined();
            expect(frame.galeriePictures[0].pendingImage.fileName).toBeUndefined();
            expect(frame.galeriePictures[0].pendingImage.format).toBeTruthy();
            expect(frame.galeriePictures[0].pendingImage.height).toBeTruthy();
            expect(frame.galeriePictures[0].pendingImage.id).toBeUndefined();
            expect(frame.galeriePictures[0].pendingImage.size).toBeTruthy();
            expect(frame.galeriePictures[0].pendingImage.signedUrl).toBeTruthy();
            expect(frame.galeriePictures[0].pendingImage.updatedAt).toBeUndefined();
            expect(frame.galeriePictures[0].pendingImage.width).toBeTruthy();
            expect(frame.galeriePictures[0].pendingImageId).toBeUndefined();
            expect(frame.galeriePictures[0].updatedAt).toBeUndefined();
            expect(frame.id).toBeTruthy();
            expect(frame.numOfLikes).toBe(0);
            expect(frame.updatedAt).toBeUndefined();
            expect(frame.user.authTokenVersion).toBeUndefined();
            expect(frame.user.confirmed).toBeUndefined();
            expect(frame.user.confirmTokenVersion).toBeUndefined();
            expect(frame.user.createdAt).toBeUndefined();
            expect(frame.user.currentProfilePicture).toBeNull();
            expect(frame.user.defaultProfilePicture).toBe(user.defaultProfilePicture);
            expect(frame.user.email).toBeUndefined();
            expect(frame.user.emailTokenVersion).toBeUndefined();
            expect(frame.user.facebookId).toBeUndefined();
            expect(frame.user.googleId).toBeUndefined();
            expect(frame.user.id).toBe(user.id);
            expect(frame.user.password).toBeUndefined();
            expect(frame.user.pseudonym).toBe(user.pseudonym);
            expect(frame.user.resetPasswordTokenVersion).toBeUndefined();
            expect(frame.user.role).toBe(user.role);
            expect(frame.user.socialMediaUserName).toBe(user.socialMediaUserName);
            expect(frame.user.updatedEmailTokenVersion).toBeUndefined();
            expect(frame.user.updatedAt).toBeUndefined();
            expect(frame.user.userName).toBe(user.userName);
            expect(returnedGalerieId).toBe(galerieId);
          });
          it('create a frame width 2 images', async () => {
            const {
              body: {
                data: {
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId, 2);
            const createdFrames = await Frame.findAll({
              where: {
                galerieId,
              },
            });
            const createdGaleriePicture = await GaleriePicture.findAll({
              where: {
                frameId: createdFrames[0].id,
              },
            });
            const createdCropedImageFirst = await Image
              .findByPk(createdGaleriePicture[0].cropedImageId);
            const createdCropedImageSecond = await Image
              .findByPk(createdGaleriePicture[1].cropedImageId);
            const createdOriginalImageFirst = await Image
              .findByPk(createdGaleriePicture[0].originalImageId);
            const createdOriginalImageSecond = await Image
              .findByPk(createdGaleriePicture[1].originalImageId);
            const createdPendingImageFirst = await Image
              .findByPk(createdGaleriePicture[0].pendingImageId);
            const createdPendingImageSecond = await Image
              .findByPk(createdGaleriePicture[1].pendingImageId);
            const [bucketCropedImages] = await gc
              .bucket(GALERIES_BUCKET_PP_CROP)
              .getFiles();
            const [bucketOriginalImages] = await gc
              .bucket(GALERIES_BUCKET_PP)
              .getFiles();
            const [bucketPendingImages] = await gc
              .bucket(GALERIES_BUCKET_PP_PENDING)
              .getFiles();
            expect(bucketCropedImages.length).toBe(2);
            expect(bucketOriginalImages.length).toBe(2);
            expect(bucketPendingImages.length).toBe(2);
            expect(createdCropedImageFirst).not.toBeNull();
            expect(createdCropedImageSecond).not.toBeNull();
            expect(createdFrames.length).toBe(1);
            expect(createdGaleriePicture.length).toBe(2);
            expect(createdOriginalImageFirst).not.toBeNull();
            expect(createdOriginalImageSecond).not.toBeNull();
            expect(createdPendingImageFirst).not.toBeNull();
            expect(createdPendingImageSecond).not.toBeNull();
            expect(frame.galeriePictures.length).toBe(2);
          });
          it('create a frame width 3 images', async () => {
            const {
              body: {
                data: {
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId, 3);
            const createdFrames = await Frame.findAll({
              where: {
                galerieId,
              },
            });
            const createdGaleriePicture = await GaleriePicture.findAll({
              where: {
                frameId: createdFrames[0].id,
              },
            });
            const createdCropedImageFirst = await Image
              .findByPk(createdGaleriePicture[0].cropedImageId);
            const createdCropedImageSecond = await Image
              .findByPk(createdGaleriePicture[1].cropedImageId);
            const createdCropedImageThird = await Image
              .findByPk(createdGaleriePicture[2].cropedImageId);
            const createdOriginalImageFirst = await Image
              .findByPk(createdGaleriePicture[0].originalImageId);
            const createdOriginalImageSecond = await Image
              .findByPk(createdGaleriePicture[1].originalImageId);
            const createdOriginalImageThird = await Image
              .findByPk(createdGaleriePicture[2].originalImageId);
            const createdPendingImageFirst = await Image
              .findByPk(createdGaleriePicture[0].pendingImageId);
            const createdPendingImageSecond = await Image
              .findByPk(createdGaleriePicture[1].pendingImageId);
            const createdPendingImageThird = await Image
              .findByPk(createdGaleriePicture[2].pendingImageId);
            const [bucketCropedImages] = await gc
              .bucket(GALERIES_BUCKET_PP_CROP)
              .getFiles();
            const [bucketOriginalImages] = await gc
              .bucket(GALERIES_BUCKET_PP)
              .getFiles();
            const [bucketPendingImages] = await gc
              .bucket(GALERIES_BUCKET_PP_PENDING)
              .getFiles();
            expect(bucketCropedImages.length).toBe(3);
            expect(bucketOriginalImages.length).toBe(3);
            expect(bucketPendingImages.length).toBe(3);
            expect(createdCropedImageFirst).not.toBeNull();
            expect(createdCropedImageSecond).not.toBeNull();
            expect(createdCropedImageThird).not.toBeNull();
            expect(createdFrames.length).toBe(1);
            expect(createdGaleriePicture.length).toBe(3);
            expect(createdOriginalImageFirst).not.toBeNull();
            expect(createdOriginalImageSecond).not.toBeNull();
            expect(createdOriginalImageThird).not.toBeNull();
            expect(createdPendingImageFirst).not.toBeNull();
            expect(createdPendingImageSecond).not.toBeNull();
            expect(createdPendingImageThird).not.toBeNull();
            expect(frame.galeriePictures.length).toBe(3);
          });
          it('create a frame width 4 images', async () => {
            const {
              body: {
                data: {
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId, 4);
            const [bucketCropedImages] = await gc
              .bucket(GALERIES_BUCKET_PP_CROP)
              .getFiles();
            const [bucketOriginalImages] = await gc
              .bucket(GALERIES_BUCKET_PP)
              .getFiles();
            const [bucketPendingImages] = await gc
              .bucket(GALERIES_BUCKET_PP_PENDING)
              .getFiles();
            const createdFrames = await Frame.findAll({
              where: {
                galerieId,
              },
            });
            const createdGaleriePicture = await GaleriePicture.findAll({
              where: {
                frameId: createdFrames[0].id,
              },
            });
            const createdCropedImageFirst = await Image
              .findByPk(createdGaleriePicture[0].cropedImageId);
            const createdCropedImageFourth = await Image
              .findByPk(createdGaleriePicture[3].cropedImageId);
            const createdCropedImageSecond = await Image
              .findByPk(createdGaleriePicture[1].cropedImageId);
            const createdCropedImageThird = await Image
              .findByPk(createdGaleriePicture[2].cropedImageId);
            const createdOriginalImageFirst = await Image
              .findByPk(createdGaleriePicture[0].originalImageId);
            const createdOriginalImageFourth = await Image
              .findByPk(createdGaleriePicture[3].originalImageId);
            const createdOriginalImageSecond = await Image
              .findByPk(createdGaleriePicture[1].originalImageId);
            const createdOriginalImageThird = await Image
              .findByPk(createdGaleriePicture[2].originalImageId);
            const createdPendingImageFirst = await Image
              .findByPk(createdGaleriePicture[0].pendingImageId);
            const createdPendingImageFourth = await Image
              .findByPk(createdGaleriePicture[3].pendingImageId);
            const createdPendingImageSecond = await Image
              .findByPk(createdGaleriePicture[1].pendingImageId);
            const createdPendingImageThird = await Image
              .findByPk(createdGaleriePicture[2].pendingImageId);
            expect(bucketCropedImages.length).toBe(4);
            expect(bucketOriginalImages.length).toBe(4);
            expect(bucketPendingImages.length).toBe(4);
            expect(frame.galeriePictures.length).toBe(4);
            expect(createdFrames.length).toBe(1);
            expect(createdCropedImageFirst).not.toBeNull();
            expect(createdCropedImageFourth).not.toBeNull();
            expect(createdCropedImageSecond).not.toBeNull();
            expect(createdCropedImageThird).not.toBeNull();
            expect(createdGaleriePicture.length).toBe(4);
            expect(createdOriginalImageFirst).not.toBeNull();
            expect(createdOriginalImageFourth).not.toBeNull();
            expect(createdOriginalImageSecond).not.toBeNull();
            expect(createdOriginalImageThird).not.toBeNull();
            expect(createdPendingImageFirst).not.toBeNull();
            expect(createdPendingImageFourth).not.toBeNull();
            expect(createdPendingImageSecond).not.toBeNull();
            expect(createdPendingImageThird).not.toBeNull();
          });
          it('create a frame width 5 images', async () => {
            const {
              body: {
                data: {
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId, 5);
            const [bucketCropedImages] = await gc
              .bucket(GALERIES_BUCKET_PP_CROP)
              .getFiles();
            const [bucketOriginalImages] = await gc
              .bucket(GALERIES_BUCKET_PP)
              .getFiles();
            const [bucketPendingImages] = await gc
              .bucket(GALERIES_BUCKET_PP_PENDING)
              .getFiles();
            const createdFrames = await Frame.findAll({
              where: {
                galerieId,
              },
            });
            const createdGaleriePicture = await GaleriePicture.findAll({
              where: {
                frameId: createdFrames[0].id,
              },
            });
            const createdCropedImageFifth = await Image
              .findByPk(createdGaleriePicture[4].cropedImageId);
            const createdCropedImageFirst = await Image
              .findByPk(createdGaleriePicture[0].cropedImageId);
            const createdCropedImageFourth = await Image
              .findByPk(createdGaleriePicture[3].cropedImageId);
            const createdCropedImageSecond = await Image
              .findByPk(createdGaleriePicture[1].cropedImageId);
            const createdCropedImageThird = await Image
              .findByPk(createdGaleriePicture[2].cropedImageId);
            const createdOriginalImageFifth = await Image
              .findByPk(createdGaleriePicture[4].originalImageId);
            const createdOriginalImageFirst = await Image
              .findByPk(createdGaleriePicture[0].originalImageId);
            const createdOriginalImageFourth = await Image
              .findByPk(createdGaleriePicture[3].originalImageId);
            const createdOriginalImageSecond = await Image
              .findByPk(createdGaleriePicture[1].originalImageId);
            const createdOriginalImageThird = await Image
              .findByPk(createdGaleriePicture[2].originalImageId);
            const createdPendingImageFifth = await Image
              .findByPk(createdGaleriePicture[4].pendingImageId);
            const createdPendingImageFirst = await Image
              .findByPk(createdGaleriePicture[0].pendingImageId);
            const createdPendingImageFourth = await Image
              .findByPk(createdGaleriePicture[3].pendingImageId);
            const createdPendingImageSecond = await Image
              .findByPk(createdGaleriePicture[1].pendingImageId);
            const createdPendingImageThird = await Image
              .findByPk(createdGaleriePicture[2].pendingImageId);
            expect(bucketCropedImages.length).toBe(5);
            expect(bucketOriginalImages.length).toBe(5);
            expect(bucketPendingImages.length).toBe(5);
            expect(frame.galeriePictures.length).toBe(5);
            expect(createdFrames.length).toBe(1);
            expect(createdCropedImageFifth).not.toBeNull();
            expect(createdCropedImageFirst).not.toBeNull();
            expect(createdCropedImageFourth).not.toBeNull();
            expect(createdCropedImageSecond).not.toBeNull();
            expect(createdCropedImageThird).not.toBeNull();
            expect(createdGaleriePicture.length).toBe(5);
            expect(createdOriginalImageFifth).not.toBeNull();
            expect(createdOriginalImageFirst).not.toBeNull();
            expect(createdOriginalImageFourth).not.toBeNull();
            expect(createdOriginalImageSecond).not.toBeNull();
            expect(createdOriginalImageThird).not.toBeNull();
            expect(createdPendingImageFifth).not.toBeNull();
            expect(createdPendingImageFirst).not.toBeNull();
            expect(createdPendingImageFourth).not.toBeNull();
            expect(createdPendingImageSecond).not.toBeNull();
            expect(createdPendingImageThird).not.toBeNull();
          });
          it('create a frame width 6 images', async () => {
            const {
              body: {
                data: {
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId, 6);
            const [bucketCropedImages] = await gc
              .bucket(GALERIES_BUCKET_PP_CROP)
              .getFiles();
            const [bucketOriginalImages] = await gc
              .bucket(GALERIES_BUCKET_PP)
              .getFiles();
            const [bucketPendingImages] = await gc
              .bucket(GALERIES_BUCKET_PP_PENDING)
              .getFiles();
            const createdFrames = await Frame.findAll({
              where: {
                galerieId,
              },
            });
            const createdGaleriePicture = await GaleriePicture.findAll({
              where: {
                frameId: createdFrames[0].id,
              },
            });
            const createdCropedImageFifth = await Image
              .findByPk(createdGaleriePicture[4].cropedImageId);
            const createdCropedImageFirst = await Image
              .findByPk(createdGaleriePicture[0].cropedImageId);
            const createdCropedImageFourth = await Image
              .findByPk(createdGaleriePicture[3].cropedImageId);
            const createdCropedImageSecond = await Image
              .findByPk(createdGaleriePicture[1].cropedImageId);
            const createdCropedImageSixth = await Image
              .findByPk(createdGaleriePicture[5].cropedImageId);
            const createdCropedImageThird = await Image
              .findByPk(createdGaleriePicture[2].cropedImageId);
            const createdOriginalImageFifth = await Image
              .findByPk(createdGaleriePicture[4].originalImageId);
            const createdOriginalImageFirst = await Image
              .findByPk(createdGaleriePicture[0].originalImageId);
            const createdOriginalImageFourth = await Image
              .findByPk(createdGaleriePicture[3].originalImageId);
            const createdOriginalImageSecond = await Image
              .findByPk(createdGaleriePicture[1].originalImageId);
            const createdOriginalImageSixth = await Image
              .findByPk(createdGaleriePicture[5].originalImageId);
            const createdOriginalImageThird = await Image
              .findByPk(createdGaleriePicture[2].originalImageId);
            const createdPendingImageFifth = await Image
              .findByPk(createdGaleriePicture[4].pendingImageId);
            const createdPendingImageFirst = await Image
              .findByPk(createdGaleriePicture[0].pendingImageId);
            const createdPendingImageFourth = await Image
              .findByPk(createdGaleriePicture[3].pendingImageId);
            const createdPendingImageSecond = await Image
              .findByPk(createdGaleriePicture[1].pendingImageId);
            const createdPendingImageSixth = await Image
              .findByPk(createdGaleriePicture[1].pendingImageId);
            const createdPendingImageThird = await Image
              .findByPk(createdGaleriePicture[2].pendingImageId);
            expect(bucketCropedImages.length).toBe(6);
            expect(bucketOriginalImages.length).toBe(6);
            expect(bucketPendingImages.length).toBe(6);
            expect(frame.galeriePictures.length).toBe(6);
            expect(createdFrames.length).toBe(1);
            expect(createdCropedImageFifth).not.toBeNull();
            expect(createdCropedImageFirst).not.toBeNull();
            expect(createdCropedImageFourth).not.toBeNull();
            expect(createdCropedImageSecond).not.toBeNull();
            expect(createdCropedImageSixth).not.toBeNull();
            expect(createdCropedImageThird).not.toBeNull();
            expect(createdGaleriePicture.length).toBe(6);
            expect(createdOriginalImageFifth).not.toBeNull();
            expect(createdOriginalImageFirst).not.toBeNull();
            expect(createdOriginalImageFourth).not.toBeNull();
            expect(createdOriginalImageSecond).not.toBeNull();
            expect(createdOriginalImageSixth).not.toBeNull();
            expect(createdOriginalImageThird).not.toBeNull();
            expect(createdPendingImageFifth).not.toBeNull();
            expect(createdPendingImageFirst).not.toBeNull();
            expect(createdPendingImageFourth).not.toBeNull();
            expect(createdPendingImageSecond).not.toBeNull();
            expect(createdPendingImageSixth).not.toBeNull();
            expect(createdPendingImageThird).not.toBeNull();
          });
          it('fetch the current profile picture', async () => {
            await postProfilePicture(app, token);
            const {
              body: {
                data: {
                  frame,
                },
              },
            } = await postGaleriesIdFrames(app, token, galerieId);
            expect(frame.user.currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.format).toBeTruthy();
            expect(frame.user.currentProfilePicture.cropedImage.height).toBeTruthy();
            expect(frame.user.currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.signedUrl).toBeTruthy();
            expect(frame.user.currentProfilePicture.cropedImage.size).toBeTruthy();
            expect(frame.user.currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.width).toBeTruthy();
            expect(frame.user.currentProfilePicture.cropedImageId).toBeUndefined();
            expect(frame.user.currentProfilePicture.id).toBeTruthy();
            expect(frame.user.currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.format).toBeTruthy();
            expect(frame.user.currentProfilePicture.originalImage.height).toBeTruthy();
            expect(frame.user.currentProfilePicture.originalImage.id).toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.signedUrl).toBeTruthy();
            expect(frame.user.currentProfilePicture.originalImage.size).toBeTruthy();
            expect(frame.user.currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.width).toBeTruthy();
            expect(frame.user.currentProfilePicture.originalImageId).toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.format).toBeTruthy();
            expect(frame.user.currentProfilePicture.pendingImage.height).toBeTruthy();
            expect(frame.user.currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.signedUrl).toBeTruthy();
            expect(frame.user.currentProfilePicture.pendingImage.size).toBeTruthy();
            expect(frame.user.currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.width).toBeTruthy();
            expect(frame.user.currentProfilePicture.pendingImageId).toBeUndefined();
            expect(frame.user.currentProfilePicture.updatedAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.userId).toBeUndefined();
          });
        });
        describe('should return error 400 if', () => {
          it('no images are sent', async () => {
            const {
              body,
              status,
            } = await postGaleriesIdFrames(app, token, galerieId, 0);
            expect(body.errors).toBe(FILES_ARE_REQUIRED);
            expect(status).toBe(400);
          });
          it('more than 6 image have been sent', async () => {
            const {
              body,
              status,
            } = await postGaleriesIdFrames(app, token, galerieId, 7);
            expect(body.errors).toBe('too much files have been sent');
            expect(status).toBe(400);
          });
          it('one of the files is not an image', async () => {
            const {
              body,
              status,
            } = await postGaleriesIdFrames(app, token, galerieId, 1, true);
            expect(body.errors).toBe(FILE_IS_IMAGE);
            expect(status).toBe(400);
          });
          it('TODO: galerie is archived', async () => {});
        });
        describe('should return error 404 if', () => {
          it('galerie not found', async () => {
            const {
              body,
              status,
            } = await postGaleriesIdFrames(app, token, '100', 0);
            expect(body.errors).toBe('galerie not found');
            expect(status).toBe(404);
          });
          it('user not subscribe to requested galerie', async () => {
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
              name: 'galerie\'s name',
            });
            const {
              body,
              status,
            } = await postGaleriesIdFrames(app, token, id, 0);
            expect(body.errors).toBe('galerie not found');
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
