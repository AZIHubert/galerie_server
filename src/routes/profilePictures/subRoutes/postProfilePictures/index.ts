// POST /profilePictures/

import {
  Request,
  Response,
} from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import checkExtension from '@src/helpers/checkExtension';
import {
  DEFAULT_ERROR_MESSAGE,
  FILE_SHOULD_BE_AN_IMAGE,
  FILE_IS_REQUIRED,
} from '@src/helpers/errorMessages';
import {
  imageExcluder,
  profilePictureExcluder,
} from '@src/helpers/excluders';
import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { file } = req;
  const objectImageExcluder: { [key: string]: undefined } = {};
  const objectProfilePictureExcluder: { [key: string]: undefined } = {};
  const createdImages: Array<Image> = [];
  let cropedImageSignedUrl;
  let images: Array<Image>;
  let originalImageSignedUrl;
  let pendingImageSignedUrl;
  let profilePicture: ProfilePicture;
  let rejection: boolean = false;

  // Check if file is send.
  if (!file) {
    return res.status(400).send({
      errors: FILE_IS_REQUIRED,
    });
  }

  // Check if file is an image.
  const isImage = checkExtension(file);
  if (!isImage) {
    return res.status(400).send({
      errors: FILE_SHOULD_BE_AN_IMAGE,
    });
  }
  const { buffer } = file;

  // Save a croped image on Google Bucket.
  const cropedImagePromise: Promise<Image> = new Promise((resolve, reject) => {
    const fileName = `croped_${Date.now()}_${uuidv4()}.jpg`;
    const image = sharp(buffer)
      .resize(600, 600);

    image
      .toBuffer({ resolveWithObject: true })
      .then(({
        info: {
          format,
          size,
          width,
          height,
        },
      }) => {
        const blobStream = gc
          .bucket(GALERIES_BUCKET_PP_CROP)
          .file(fileName)
          .createWriteStream({
            resumable: false,
          });
        image
          .pipe(blobStream)
          .on('error', (err) => {
            reject(err);
          }).on('finish', async () => {
            if (rejection) {
              try {
                await gc
                  .bucket(GALERIES_BUCKET_PP_CROP)
                  .file(fileName)
                  .delete();
              } catch (err) {
                reject(err);
              }
              reject(new Error(DEFAULT_ERROR_MESSAGE));
            } else {
              try {
                const cropedImage = await Image.create({
                  bucketName: GALERIES_BUCKET_PP_CROP,
                  fileName,
                  format,
                  height,
                  size,
                  width,
                  userId,
                });
                createdImages.push(cropedImage);
                resolve(cropedImage);
              } catch (err) {
                reject(err);
              }
            }
          });
      });
  });

  // Save the original image on Google Bucket.
  const originalImagePromise: Promise<Image> = new Promise((resolve, reject) => {
    const fileName = `original_${Date.now()}_${uuidv4()}.jpg`;
    const image = sharp(buffer);
    image
      .toBuffer({ resolveWithObject: true })
      .then(({
        info: {
          format,
          size,
          width,
          height,
        },
      }) => {
        const blobStream = gc
          .bucket(GALERIES_BUCKET_PP)
          .file(fileName)
          .createWriteStream({
            resumable: false,
          });
        image
          .pipe(blobStream)
          .on('error', (err) => {
            reject(err);
          }).on('finish', async () => {
            if (rejection) {
              try {
                await gc
                  .bucket(GALERIES_BUCKET_PP_CROP)
                  .file(fileName)
                  .delete();
              } catch (err) {
                reject(err);
              }
              reject(new Error(DEFAULT_ERROR_MESSAGE));
            } else {
              try {
                const originalImage = await Image.create({
                  bucketName: GALERIES_BUCKET_PP,
                  fileName,
                  format,
                  height,
                  size,
                  width,
                  userId,
                });
                createdImages.push(originalImage);
                resolve(originalImage);
              } catch (err) {
                reject(err);
              }
            }
          });
      });
  });

  // Save a pending image (1x1px) on Google Bucket.
  const pendingImagePromise: Promise<Image> = new Promise((resolve, reject) => {
    const fileName = `pending_${Date.now()}_${uuidv4()}.jpg`;
    // Need to twist saturation and brightness,
    // if not, the image is to grayish.
    const image = sharp(buffer)
      .blur(10)
      .modulate({
        saturation: 2.2,
        brightness: 1.4,
      })
      .resize(1, 1);
    image
      .toBuffer({ resolveWithObject: true })
      .then(({
        info: {
          format,
          size,
          width,
          height,
        },
      }) => {
        const blobStream = gc
          .bucket(GALERIES_BUCKET_PP_PENDING)
          .file(fileName)
          .createWriteStream({
            resumable: false,
          });
        image
          .pipe(blobStream)
          .on('error', (err) => {
            reject(err);
          }).on('finish', async () => {
            if (rejection) {
              try {
                await gc
                  .bucket(GALERIES_BUCKET_PP_CROP)
                  .file(fileName)
                  .delete();
              } catch (err) {
                reject(err);
              }
              reject(new Error(DEFAULT_ERROR_MESSAGE));
            }
            try {
              const pendingImage = await Image.create({
                bucketName: GALERIES_BUCKET_PP_PENDING,
                fileName,
                format,
                height,
                size,
                width,
                userId,
              });
              createdImages.push(pendingImage);
              resolve(pendingImage);
            } catch (err) {
              reject(err);
            }
          });
      });
  });

  // Saved all three images
  // on Google Cloud
  try {
    images = await Promise.all([
      cropedImagePromise,
      originalImagePromise,
      pendingImagePromise,
    ]);
  } catch (err) {
    // If error, set rejection to false
    // to prevent to create images.
    // Delete created images
    // and there Google Images.
    rejection = true;
    try {
      await Promise.all(
        createdImages.map(async (image) => {
          await gc
            .bucket(image.bucketName)
            .file(image.fileName)
            .delete();
          await image.destroy();
        }),
      );
    } catch (errTwo) {
      return res.status(500).send(errTwo);
    }
    return res.status(500).send(err);
  }

  // Set current profile picture to false.
  try {
    await ProfilePicture.update({
      current: false,
    }, {
      where: {
        current: true,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  const [
    cropedImage,
    originalImage,
    pendingImage,
  ] = images;

  // Fetch signedUrl for all three
  // created images
  try {
    cropedImageSignedUrl = await signedUrl(
      cropedImage.bucketName,
      cropedImage.fileName,
    );
    originalImageSignedUrl = await signedUrl(
      originalImage.bucketName,
      originalImage.fileName,
    );
    pendingImageSignedUrl = await signedUrl(
      pendingImage.bucketName,
      pendingImage.fileName,
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // If one of the signedUrl is not OK
  // delete the other Google Images
  // and all three images.
  try {
    if (
      !cropedImageSignedUrl.OK
      || !originalImageSignedUrl.OK
      || !pendingImageSignedUrl.OK
    ) {
      if (cropedImageSignedUrl.OK) {
        await gc
          .bucket(cropedImage.bucketName)
          .file(cropedImage.fileName)
          .delete();
      }
      if (originalImageSignedUrl.OK) {
        await gc
          .bucket(originalImage.bucketName)
          .file(originalImage.fileName)
          .delete();
      }
      if (pendingImageSignedUrl.OK) {
        await gc
          .bucket(pendingImage.bucketName)
          .file(pendingImage.fileName)
          .delete();
      }
      await cropedImage.destroy();
      await originalImage.destroy();
      await pendingImage.destroy();
      return res.status(500).send({
        errors: DEFAULT_ERROR_MESSAGE,
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  // Create profile picture.
  try {
    profilePicture = await ProfilePicture.create({
      cropedImageId: cropedImage.id,
      current: true,
      originalImageId: originalImage.id,
      pendingImageId: pendingImage.id,
      userId,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // compose returned profile picture.
  profilePictureExcluder.forEach((e) => {
    objectProfilePictureExcluder[e] = undefined;
  });
  imageExcluder.forEach((e) => {
    objectImageExcluder[e] = undefined;
  });
  const returnedProfilePicture = {
    ...profilePicture.toJSON(),
    ...objectProfilePictureExcluder,
    cropedImage: {
      ...cropedImage.toJSON(),
      ...objectImageExcluder,
      bucketName: undefined,
      fileName: undefined,
      signedUrl: cropedImageSignedUrl.signedUrl,
    },
    originalImage: {
      ...originalImage.toJSON(),
      ...objectImageExcluder,
      bucketName: undefined,
      fileName: undefined,
      signedUrl: originalImageSignedUrl.signedUrl,
    },
    pendingImage: {
      ...pendingImage.toJSON(),
      ...objectImageExcluder,
      bucketName: undefined,
      fileName: undefined,
      signedUrl: pendingImageSignedUrl.signedUrl,
    },
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      profilePicture: returnedProfilePicture,
    },
  });
};
