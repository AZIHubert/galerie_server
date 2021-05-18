import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import {
  galeriePictureExcluder,
  imageExcluder,
} from '@src/helpers/excluders';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    frameId,
    galeriePictureId,
  } = req.params;
  const { id: userId } = req.user as User;
  let galerie: Galerie | null;
  let returnedGaleriePicture;

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          model: User,
          where: {
            id: userId,
          },
        },
        {
          include: [{
            attributes: {
              exclude: galeriePictureExcluder,
            },
            include: [
              {
                as: 'cropedImage',
                attributes: {
                  exclude: imageExcluder,
                },
                model: Image,
              },
              {
                model: Image,
                as: 'originalImage',
                attributes: {
                  exclude: imageExcluder,
                },
              },
              {
                model: Image,
                as: 'pendingImage',
                attributes: {
                  exclude: imageExcluder,
                },
              },
            ],
            model: GaleriePicture,
          }],
          model: Frame,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Check if user's role for this galerie
  // is creator or admin.
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'your\'re not allow to update this frame',
    });
  }

  // Check if galerie is not archived.
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot update an archived galerie',
    });
  }

  // Check if frame exist.
  const frame = galerie.frames
    .filter((f) => String(f.id) === frameId)[0];
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }

  // Check if galerie picture exist.
  const galeriePicture = frame.galeriePictures
    .filter((gp) => gp.id === galeriePictureId)[0];
  if (!galeriePicture) {
    return res.status(404).send({
      errors: 'galerie picture not found',
    });
  }

  // If galerie picuture with :galeriePictureId
  // is not the current cover picture,
  // set current galerie picture to false if exist.
  if (!galeriePicture.current) {
    const allGaleriePictures: Array<GaleriePicture> = [];

    // Set all galerie pictures into a flat array.
    galerie.frames.forEach((f) => {
      f.galeriePictures.forEach((gp) => {
        allGaleriePictures.push(gp);
      });
    });
    // Check if one galerie picture's coverPicture
    // attribute is true.
    const currentCoverPicture = allGaleriePictures
      .filter((gp) => gp.current);
    if (currentCoverPicture.length) {
      try {
        await currentCoverPicture[0].update({
          current: false,
        });
      } catch (err) {
        return res.status(500).send(err);
      }
    }
  }

  // Revers galeriePicture.coverPicture boolean value.
  try {
    await galeriePicture.update({
      current: !galeriePicture.current,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // get SignedUrl of images
  // and compose the final galerie picture.
  try {
    const {
      cropedImage: {
        bucketName: cropedImageBucketName,
        fileName: cropedImageFileName,
      },
      originalImage: {
        bucketName: originalImageBucketName,
        fileName: originalImageFileName,
      },
      pendingImage: {
        bucketName: pendingImageBucketName,
        fileName: pendingImageFileName,
      },
    } = galeriePicture;
    const cropedImageSignedUrl = await signedUrl(
      cropedImageBucketName,
      cropedImageFileName,
    );
    const originalImageSignedUrl = await signedUrl(
      originalImageBucketName,
      originalImageFileName,
    );
    const pendingImageSignedUrl = await signedUrl(
      pendingImageBucketName,
      pendingImageFileName,
    );
    returnedGaleriePicture = {
      ...galeriePicture.toJSON(),
      cropedImage: {
        ...galeriePicture.cropedImage.toJSON(),
        bucketName: undefined,
        fileName: undefined,
        signedUrl: cropedImageSignedUrl,
      },
      originalImage: {
        ...galeriePicture.originalImage.toJSON(),
        bucketName: undefined,
        fileName: undefined,
        signedUrl: originalImageSignedUrl,
      },
      pendingImage: {
        ...galeriePicture.pendingImage.toJSON(),
        bucketName: undefined,
        fileName: undefined,
        signedUrl: pendingImageSignedUrl,
      },
      updatedAt: undefined,
    };
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      frameId,
      galerieId,
      galeriePicture: returnedGaleriePicture,
    },
  });
};
