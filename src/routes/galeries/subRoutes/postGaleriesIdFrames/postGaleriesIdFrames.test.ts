import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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
  deleteUser,
  login,
  postGalerie,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');
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
    describe('/frames', () => {
      describe('POST', () => {
        describe('should return status 200 and', () => {
          it('create a frame width 1 images', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  frame: returnedFrame,
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
            expect(returnedFrame.createdAt).not.toBeUndefined();
            expect(returnedFrame.galerieId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].current).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].createdAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImageId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.bucketName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.createdAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.format).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.fileName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.height).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.id).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.signedUrl).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.size).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.updatedAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].cropedImage.width).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].frameId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].id).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].index).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImageId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.bucketName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.createdAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.format).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.fileName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.height).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.id).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.signedUrl).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.size).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.updatedAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].originalImage.width).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImageId).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.bucketName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.createdAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.format).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.fileName).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.height).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.id).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.signedUrl).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.size).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.updatedAt).toBeUndefined();
            expect(returnedFrame.galeriePictures[0].pendingImage.width).not.toBeUndefined();
            expect(returnedFrame.galeriePictures[0].updatedAt).toBeUndefined();
            expect(returnedFrame.id).not.toBeUndefined();
            expect(returnedFrame.numOfLikes).toBe(0);
            expect(returnedFrame.updatedAt).toBeUndefined();
            expect(returnedFrame.user.authTokenVersion).toBeUndefined();
            expect(returnedFrame.user.confirmed).toBeUndefined();
            expect(returnedFrame.user.confirmedTokenVersion).toBeUndefined();
            expect(returnedFrame.user.createdAt).not.toBeUndefined();
            expect(returnedFrame.user.defaultProfilePicture).not.toBeUndefined();
            expect(returnedFrame.user.emailTokenVersion).toBeUndefined();
            expect(returnedFrame.user.email).toBeUndefined();
            expect(returnedFrame.user.facebookId).toBeUndefined();
            expect(returnedFrame.user.googleId).toBeUndefined();
            expect(returnedFrame.user.id).not.toBeUndefined();
            expect(returnedFrame.user.password).toBeUndefined();
            expect(returnedFrame.user.pseudonym).not.toBeUndefined();
            expect(returnedFrame.user.resetPasswordTokenVersion).toBeUndefined();
            expect(returnedFrame.user.role).not.toBeUndefined();
            expect(returnedFrame.user.socialMediaUserName).not.toBeUndefined();
            expect(returnedFrame.user.updatedAt).toBeUndefined();
            expect(returnedFrame.user.updatedEmailTokenVersion).toBeUndefined();
            expect(returnedFrame.user.userName).not.toBeUndefined();
            expect(returnedFrame.userId).toBeUndefined();
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
            expect(frame.user.currentProfilePicture.cropedImage.format).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.height).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.id).toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.size).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImage.width).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.cropedImageId).toBeUndefined();
            expect(frame.user.currentProfilePicture.id).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.format).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.height).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.id).toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.size).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImage.width).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.originalImageId).toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.format).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.height).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.id).toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.size).not.toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
            expect(frame.user.currentProfilePicture.pendingImage.width).not.toBeUndefined();
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
          it('galerie is archived', async () => {
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
                    code,
                  },
                },
              },
            } = await postGaleriesIdInvitations(app, token, galerieId, {});
            await postGaleriesSubscribe(app, tokenTwo, { code });
            await deleteUser(app, token, {
              deleteAccountSentence: 'delete my account',
              password: userPassword,
              userNameOrEmail: user.email,
            });
            const {
              body,
              status,
            } = await postGaleriesIdFrames(app, tokenTwo, galerieId);
            expect(body.errors).toBe('you cannot post on an archived galerie');
            expect(status).toBe(400);
          });
        });
        describe('should return error 404 if', () => {
          it('galerie not found', async () => {
            const {
              body,
              status,
            } = await postGaleriesIdFrames(app, token, uuidv4(), 0);
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
