import { Request, Response } from 'express';
import progressStream from 'progress-stream';
import sharp from 'sharp';
import socketIo from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import User from '@src/db/models/user';
import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import accEnv from '@src/helpers/accEnv';
import checkExtension from '@src/helpers/checkExtension';
import gc from '@src/helpers/gc';
import {
  USER_NOT_FOUND,
  FILE_IS_IMAGE,
  FILE_IS_REQUIRED,
} from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

export default (io: socketIo.Server) => async (req: Request, res: Response) => {
  const { file } = req;
  if (!file) {
    return res.status(400).send({
      errors: FILE_IS_REQUIRED,
    });
  }
  const isImage = checkExtension(file);
  if (!isImage) {
    return res.status(400).send({
      errors: FILE_IS_IMAGE,
    });
  }
  const user = req.user as User;
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  const { id: userId } = user;
  const { buffer } = file;
  let uploadedSize = 0;
  const originalImagePromise: Promise<Image> = new Promise((resolve, reject) => {
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
        const fileName = `${Date.now()}_${uuidv4()}.jpg`;
        const blobStream = gc
          .bucket(GALERIES_BUCKET_PP)
          .file(fileName)
          .createWriteStream({
            resumable: false,
          });
        const str = progressStream({
          length: size,
          time: 100,
        });
        let previousPercentage = 0;
        str.on('progress', ({ percentage }) => {
          if (previousPercentage !== percentage) {
            uploadedSize += percentage / 300;
            previousPercentage = percentage;
            io.emit('uploadImage', uploadedSize);
          }
        });
        image
          .pipe(str)
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
  const cropedImagePromise: Promise<Image> = new Promise((resolve, reject) => {
    const image = sharp(buffer)
      .resize(200, 200);
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
        const fileName = `${Date.now()}_${uuidv4()}.jpg`;
        const blobStream = gc
          .bucket(GALERIES_BUCKET_PP_CROP)
          .file(fileName)
          .createWriteStream({
            resumable: false,
          });
        const str = progressStream({
          length: size,
          time: 100,
        });
        let previousPercentage = 0;
        str.on('progress', ({ percentage }) => {
          if (previousPercentage !== percentage) {
            uploadedSize += percentage / 300;
            previousPercentage = percentage;
            io.emit('uploadImage', uploadedSize);
          }
        });
        image
          .pipe(str)
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
  const pendingImagePromise: Promise<Image> = new Promise((resolve, reject) => {
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
        const fileName = `${Date.now()}_${uuidv4()}.jpg`;
        const blobStream = gc
          .bucket(GALERIES_BUCKET_PP_PENDING)
          .file(fileName)
          .createWriteStream({
            resumable: false,
          });
        const str = progressStream({
          length: size,
          time: 100,
        });
        let previousPercentage = 0;
        str.on('progress', ({ percentage }) => {
          if (previousPercentage !== percentage) {
            uploadedSize += percentage / 300;
            previousPercentage = percentage;
            io.emit('uploadImage', uploadedSize);
          }
        });
        image
          .pipe(str)
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
  const [
    {
      id: originalImageId,
      bucketName: originalImageBucketName,
      fileName: originalImageFileName,
    },
    {
      id: cropedImageId,
      bucketName: cropedImageBucketName,
      fileName: cropedImageFileName,
    },
    {
      id: pendingImageId,
      bucketName: pendingImageBucketName,
      fileName: pendingImageFileName,
    },
  ] = await Promise.all([
    originalImagePromise,
    cropedImagePromise,
    pendingImagePromise,
  ]);
  let profilePicture: ProfilePicture | null;
  try {
    const { id } = await ProfilePicture.create({
      current: true,
      userId,
      originalImageId,
      cropedImageId,
      pendingImageId,
    });
    profilePicture = await ProfilePicture.findByPk(id, {
      attributes: {
        exclude: [
          'cropedImageId',
          'deletedAt',
          'originalImageId',
          'pendingImageId',
          'updatedAt',
          'userId',
        ],
      },
      include: [
        {
          model: Image,
          as: 'cropedImage',
          attributes: {
            exclude: [
              'createdAt',
              'deletedAt',
              'updatedAt',
            ],
          },
        },
        {
          model: Image,
          as: 'originalImage',
          attributes: {
            exclude: [
              'createdAt',
              'deletedAt',
              'updatedAt',
            ],
          },
        },
        {
          model: Image,
          as: 'pendingImage',
          attributes: {
            exclude: [
              'createdAt',
              'deletedAt',
              'updatedAt',
            ],
          },
        },
      ],
    });
    if (!profilePicture) {
      return res.status(500).send('something went wrong');
    }
    const originalImageSignedUrl = await signedUrl(
      originalImageBucketName,
      originalImageFileName,
    );
    profilePicture.originalImage.signedUrl = originalImageSignedUrl;
    const cropedImageSignedUrl = await signedUrl(
      cropedImageBucketName,
      cropedImageFileName,
    );
    profilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
    const pendingImageSignedUrl = await signedUrl(
      pendingImageBucketName,
      pendingImageFileName,
    );
    profilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
    await user.update({ currentProfilePictureId: profilePicture.id });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    type: 'POST',
    profilePicture,
  });
};
