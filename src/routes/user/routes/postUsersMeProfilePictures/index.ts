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
  FILE_IS_IMAGE,
  FILE_IS_REQUIRED,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { file } = req;

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
      errors: FILE_IS_IMAGE,
    });
  }
  const { buffer } = file;

  // Save a croped image on Google Bucket.
  const cropedImagePromise: Promise<Image> = new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${uuidv4()}.jpg`;
    const image = sharp(buffer)
      .resize(600, 600);

    image
      .toBuffer({ resolveWithObject: true })
      .then((value) => {
        const {
          info: {
            format,
            size,
            width,
            height,
          },
        } = value;
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
              resolve(cropedImage);
            } catch (err) {
              reject(err);
            }
          });
      });
  });

  // Save the original image on Google Bucket.
  const originalImagePromise: Promise<Image> = new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${uuidv4()}.jpg`;
    const image = sharp(buffer);

    image
      .toBuffer({ resolveWithObject: true })
      .then((value) => {
        const {
          info: {
            format,
            size,
            width,
            height,
          },
        } = value;
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
              resolve(originalImage);
            } catch (err) {
              reject(err);
            }
          });
      });
  });

  // Save a pending image (1x1px) on Google Bucket.
  const pendingImagePromise: Promise<Image> = new Promise((resolve, reject) => {
    const fileName = `${Date.now()}_${uuidv4()}.jpg`;

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
      .then((value) => {
        const {
          info: {
            format,
            size,
            width,
            height,
          },
        } = value;
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
              resolve(pendingImage);
            } catch (err) {
              reject(err);
            }
          });
      });
  });
  let profilePicture: {};
  try {
    const [
      cropedImage,
      originalImage,
      pendingImage,
    ] = await Promise.all([
      cropedImagePromise,
      originalImagePromise,
      pendingImagePromise,
    ]);

    // Set current profile picture to false.
    await ProfilePicture.update({
      current: false,
    }, {
      where: {
        current: true,
        userId,
      },
    });

    // Create a new profile picture with
    // the ids of all three images created.
    // This profile picture is now the current one.
    const newProfilePicture = await ProfilePicture.create({
      cropedImageId: cropedImage.id,
      current: true,
      originalImageId: originalImage.id,
      pendingImageId: pendingImage.id,
      userId,
    });

    // Fetch signed urls of all three images.
    const cropedImageSignedUrl = await signedUrl(
      cropedImage.bucketName,
      cropedImage.fileName,
    );
    const originalImageSignedUrl = await signedUrl(
      originalImage.bucketName,
      originalImage.fileName,
    );
    const pendingImageSignedUrl = await signedUrl(
      pendingImage.bucketName,
      pendingImage.fileName,
    );

    // Compose profile picture object to be send.
    // include signed urls and
    // remove all non necessary fields.
    profilePicture = {
      ...newProfilePicture.toJSON(),
      cropedImage: {
        ...cropedImage.toJSON(),
        bucketName: undefined,
        createdAt: undefined,
        fileName: undefined,
        signedUrl: cropedImageSignedUrl,
        updatedAt: undefined,
      },
      cropedImageId: undefined,
      originalImage: {
        ...originalImage.toJSON(),
        bucketName: undefined,
        createdAt: undefined,
        fileName: undefined,
        signedUrl: originalImageSignedUrl,
        updatedAt: undefined,
      },
      originalImageId: undefined,
      pendingImage: {
        ...pendingImage.toJSON(),
        bucketName: undefined,
        createdAt: undefined,
        fileName: undefined,
        signedUrl: pendingImageSignedUrl,
        updatedAt: undefined,
      },
      pendingImageId: undefined,
      updatedAt: undefined,
      userId: undefined,
    };
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    action: 'POST',
    data: { profilePicture },
  });
};
