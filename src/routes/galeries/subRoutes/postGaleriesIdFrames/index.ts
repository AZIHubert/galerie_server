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
  INVALID_UUID,
} from '@src/helpers/errorMessages';
import {
  frameExcluder,
  galeriePictureExcluder,
  imageExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

export default async (req: Request, res: Response) => {
  const { files } = req;
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  const objectFrameExcluder: { [key: string]: undefined } = {};
  const objectGaleriePictureExcluder: { [key: string]: undefined } = {};
  const objectImageExcluder: { [key: string]: undefined } = {};
  const objectUserExcluder: { [key: string]: undefined } = {};
  let errors;
  let frame: Frame;
  let galerie: Galerie | null;
  let returnedFrame;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // files might be of type object.
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

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: currentUser.id,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Check if galerie is not archived.
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

  // Create frame.
  try {
    frame = await Frame.create({
      galerieId,
      userId: currentUser.id,
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

          // Check if all image from Google Bucket exists.
          // If one of theme doesn\'t exist,
          // destroy all images from Google Bucket,
          // all images and all GalerieImages.
          if (
            cropedImageSignedUrl.OK
            && originalImageSignedUrl.OK
            && pendingImageSignedUrl.OK
          ) {
            // ...create galeriePicture,...
            const galeriePicture = await GaleriePicture.create({
              cropedImageId: cropedImage.id,
              frameId: frame.id,
              originalImageId: originalImage.id,
              pendingImageId: pendingImage.id,
              index,
            });

            galeriePictureExcluder.forEach((e) => {
              objectGaleriePictureExcluder[e] = undefined;
            });
            imageExcluder.forEach((e) => {
              objectImageExcluder[e] = undefined;
            });

            // ...compose the final galeriePicture...
            const returnedGaleriePicture = {
              ...galeriePicture.toJSON(),
              ...objectGaleriePictureExcluder,
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

            // ...and push it in the returnedGaleriePictures
            // which will composed the final frame.
            returnedGaleriePictures.push(returnedGaleriePicture);
          } else {
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
            throw new Error('something went wrong');
          }
        } catch (err) {
          throw new Error(err);
        }
      }),
    );

    if (returnedGaleriePictures.length) {
      // Find the current profile picture
      // of the current user.
      const currentProfilePicture = await fetchCurrentProfilePicture(currentUser);

      frameExcluder.forEach((e) => {
        objectFrameExcluder[e] = undefined;
      });
      userExcluder.forEach((e) => {
        objectUserExcluder[e] = undefined;
      });

      // Compose the final frame.
      returnedFrame = {
        ...frame.toJSON(),
        ...objectFrameExcluder,
        galeriePictures: returnedGaleriePictures,
        user: {
          ...currentUser.toJSON(),
          ...objectUserExcluder,
          currentProfilePicture,
        },
      };
    } else {
      await frame.destroy();
      return res.status(500).send({
        errors: 'something went wrong',
      });
    }
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
