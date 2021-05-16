import {
  Request,
  Response,
} from 'express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import checkExtension from '@src/helpers/checkExtension';
import {
  FILE_IS_IMAGE,
  FILES_ARE_REQUIRED,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

export default async (req: Request, res: Response) => {
  const { files } = req;
  const { galerieId } = req.params;
  const user = req.user as User;
  let errors;
  let frame: Frame;
  let galerie: Galerie | null;
  let returnedFrame;

  // files might be type of object.
  // convertToArray assure us to manipulate
  // an array of files.
  const convertToArray = () => {
    if (!files) return [];
    if (Array.isArray(files)) {
      return files;
    }
    return Object
      .values(files)
      .reduce((file) => [...file]);
  };

  // Find galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: user.id,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Cannot post frame on an archived galerie.
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot post on an archived galerie',
    });
  }

  // Check if at least one file is send.
  if (!convertToArray().length) {
    return res.status(400).send({
      errors: FILES_ARE_REQUIRED,
    });
  }

  // check if all files are images.
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

  // create frame.
  try {
    frame = await Frame.create({
      galerieId,
      userId: user.id,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // transform the array of files
  // to an array of Promise
  // that create Image and save image
  // on Google bucket.
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
                });
                resolve(pendingImage);
              } catch (err) {
                reject(err);
              }
            });
        });
    });
    return [
      cropedImagePromise,
      originalImagePromise,
      pendingImagePromise,
    ];
  });

  try {
    const returnedGaleriePictures: Array<any> = [];

    // Resolve promise for each images and
    // each of its croped/original/pending image.
    const images = await Promise.all(
      promiseImages.map((promiseImage) => Promise.all(promiseImage)),
    );

    // For each images ...
    await Promise.all(
      images.map(async (image, index) => {
        const [
          cropedImage,
          originalImage,
          pendingImage,
        ] = image;
        try {
          // ...create galeriePicture,...
          const galeriePicture = await GaleriePicture.create({
            cropedImageId: cropedImage.id,
            frameId: frame.id,
            originalImageId: originalImage.id,
            pendingImageId: pendingImage.id,
            index,
          });

          // ...fetch the signed urls,...
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

          // ...compose the final galeriePicture...
          const returnedGaleriePicture = {
            ...galeriePicture.toJSON(),
            createdAt: undefined,
            cropedImage: {
              ...cropedImage.toJSON(),
              bucketName: undefined,
              createdAt: undefined,
              fileName: undefined,
              id: undefined,
              signedUrl: cropedImageSignedUrl,
              updatedAt: undefined,
            },
            cropedImageId: undefined,
            frameId: undefined,
            originalImage: {
              ...originalImage.toJSON(),
              bucketName: undefined,
              createdAt: undefined,
              fileName: undefined,
              id: undefined,
              signedUrl: originalImageSignedUrl,
              updatedAt: undefined,
            },
            originalImageId: undefined,
            pendingImage: {
              ...pendingImage.toJSON(),
              bucketName: undefined,
              createdAt: undefined,
              fileName: undefined,
              id: undefined,
              signedUrl: pendingImageSignedUrl,
              updatedAt: undefined,
            },
            pendingImageId: undefined,
            updatedAt: undefined,
          };

          // ...and push it in the returnedGaleriePictures
          // which will composed the final frame.
          returnedGaleriePictures.push(returnedGaleriePicture);
        } catch (err) {
          throw new Error(err);
        }
      }),
    );

    // Find the current profile picture
    // of the current user.
    const currentProfilePicture = await fetchCurrentProfilePicture(user);

    // Compose the final frame.
    returnedFrame = {
      ...frame.toJSON(),
      galerieId: undefined,
      galeriePictures: returnedGaleriePictures,
      updatedAt: undefined,
      user: {
        ...user.toJSON(),
        authTokenVersion: undefined,
        confirmed: undefined,
        confirmTokenVersion: undefined,
        createdAt: undefined,
        currentProfilePicture,
        email: undefined,
        emailTokenVersion: undefined,
        facebookId: undefined,
        googleId: undefined,
        password: undefined,
        resetPasswordTokenVersion: undefined,
        updatedEmailTokenVersion: undefined,
        updatedAt: undefined,
      },
    };
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      galerieId,
      frame: returnedFrame,
    },
  });
};
