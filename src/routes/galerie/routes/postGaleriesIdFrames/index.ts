import { Request, Response } from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

import gc from '@src/helpers/gc';
import accEnv from '@src/helpers/accEnv';
import {
  GaleriePicture,
  Galerie,
  Frame,
  Image,
  User,
} from '@src/db/models';
import checkExtension from '@src/helpers/checkExtension';
import {
  FILE_IS_IMAGE,
  FILES_ARE_REQUIRED,
} from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId } = req.params;
  const galerie = await Galerie.findByPk(galerieId, {
    include: [{
      model: User,
      where: {
        id: userId,
      },
    }],
  });
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }
  const { files } = req;
  const convertToArray = () => {
    if (!files) return [];
    if (Array.isArray(files)) {
      return files;
    }
    return Object.values(files).reduce((file) => [...file]);
  };
  if (!convertToArray().length) {
    return res.status(400).send({
      errors: FILES_ARE_REQUIRED,
    });
  }
  let errors;
  convertToArray().forEach((file) => {
    const isImage = checkExtension(file);
    if (!isImage) {
      errors = FILE_IS_IMAGE;
    }
  });
  if (errors) {
    return res.status(400).send({
      errors,
    });
  }
  let frame: Frame;
  try {
    frame = await Frame.create({ userId, galerieId });
  } catch (err) {
    return res.status(500).send(err);
  }
  const promiseImages = convertToArray().map((file) => {
    const { buffer } = file;
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
    return [
      originalImagePromise,
      cropedImagePromise,
      pendingImagePromise,
    ];
  });
  let returnedFrame: Frame | null;
  try {
    const signedUrls: {
      originalImageSignedUrl: string
      cropedImageSignedUrl: string
      pendingImageSignedUrl: string
    }[] = [];
    const images = await Promise.all(
      promiseImages.map((promiseImage) => Promise.all(promiseImage)),
    );
    await Promise.all(images.map(async (image, index) => {
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
      ] = image;
      try {
        await GaleriePicture.create({
          frameId: frame.id,
          originalImageId,
          cropedImageId,
          pendingImageId,
          index,
        });
        const originalImageSignedUrl = await signedUrl(
          originalImageBucketName,
          originalImageFileName,
        );
        const cropedImageSignedUrl = await signedUrl(
          cropedImageBucketName,
          cropedImageFileName,
        );
        const pendingImageSignedUrl = await signedUrl(
          pendingImageBucketName,
          pendingImageFileName,
        );
        const urls = {
          originalImageSignedUrl,
          cropedImageSignedUrl,
          pendingImageSignedUrl,
        };
        signedUrls.push(urls);
      } catch (err) {
        throw new Error(err);
      }
    }));
    returnedFrame = await Frame.findByPk(frame.id, {
      attributes: {
        exclude: [
          'userId',
        ],
      },
      include: [
        {
          model: GaleriePicture,
          attributes: {
            exclude: [
              'id',
              'cropedImageId',
              'originalImageId',
              'pendingImageId',
              'updatedAt',
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
        },
      ],
    });
    if (!returnedFrame) {
      return res.status(500).send({
        errors: 'Something went wrong',
      });
    }
    signedUrls.forEach((url, index) => {
      if (returnedFrame) {
        returnedFrame
          .galeriePictures[index]
          .originalImage
          .signedUrl = url.originalImageSignedUrl;
        returnedFrame
          .galeriePictures[index]
          .cropedImage
          .signedUrl = url.cropedImageSignedUrl;
        returnedFrame
          .galeriePictures[index]
          .pendingImage
          .signedUrl = url.pendingImageSignedUrl;
      }
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(returnedFrame.toJSON());
};
