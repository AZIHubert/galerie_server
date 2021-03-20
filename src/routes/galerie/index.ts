import { Router } from 'express';

import {
  uploadFiles,
} from '@src/helpers/middlewares';
import signedUrl from '@src/helpers/signedUrl';
import passport from '@src/helpers/passport';

import {
  User,
  Galerie,
  ProfilePicture,
  Image,
} from '@src/db/models';
import {
  deleteGaleriesIdFramesId,
  getGaleries,
  getGaleriesId,
  getGaleriesIdFrames,
  getGaleriesIdFramesId,
  postGaleries,
  postGaleriesIdFrames,
  putGaleriesId,
} from './routes';

const router = Router();

const galeriesRoutes: () => Router = () => {
  router.delete('/:id', () => {
    // galerie should exist
    // user should be the creator
    // should delete all frames
    // should delete all galerie pictures
    // should delete all images
    // shouls delete all images from Google Storage
    // should delete all galerieUser models
  }); // delete a galerie
  router.delete('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdFramesId); // DONE
  router.get('/', passport.authenticate('jwt', { session: false }), getGaleries); // should set users profile pictures
  router.get('/:id', passport.authenticate('jwt', { session: false }), getGaleriesId); // should set users profile pictures
  router.get('/:id/frames/', passport.authenticate('jwt', { session: false }), getGaleriesIdFrames); // should populate user
  router.get('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), getGaleriesIdFramesId); // should populate user
  router.get('/:id/invits', () => {
    // check if galerie exist
    // check if user is the creator or an admin of this galerie
    // return all invit to this galerie (limit 20)
  }); // get all invit to a galerie
  router.get('/:id/invits/:invitId', () => {
    // check if galerie exist
    // check if user is the creator or an admin of this galerie
    // check if invit with invitId exist
    // and belong to this galerie
    // return this invit
  }); // get a invit to a galerie
  router.get('/:id/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { id: userId } = req.user as User;
    const { id: galerieId } = req.params;
    let galerie: Galerie | null;
    let users: User[];
    try {
      galerie = await Galerie.findByPk(galerieId, {
        include: [{
          model: User,
          where: {
            id: userId,
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
    try {
      users = await User.findAll({
        attributes: {
          exclude: [
            'authTokenVersion',
            'blackListId',
            'confirmed',
            'confirmTokenVersion',
            'currentProfilePictureId',
            'email',
            'emailTokenVersion',
            'googleId',
            'password',
            'resetPasswordTokenVersion',
            'updatedEmailTokenVersion',
          ],
        },
        include: [{
          model: Galerie,
          where: {
            id: galerieId,
          },
        }, {
          model: ProfilePicture,
          as: 'currentProfilePicture',
          attributes: {
            exclude: [
              'createdAt',
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
        }],
      });
      await Promise.all(
        users.map(async (user, index) => {
          if (user.currentProfilePicture) {
            const {
              currentProfilePicture: {
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
              },
            } = user;
            const cropedImageSignedUrl = await signedUrl(
              cropedImageBucketName,
              cropedImageFileName,
            );
            users[index].currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
            const originalImageSignedUrl = await signedUrl(
              originalImageBucketName,
              originalImageFileName,
            );
            users[index].currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
            const pendingImageSignedUrl = await signedUrl(
              pendingImageBucketName,
              pendingImageFileName,
            );
            users[index].currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
          }
        }),
      );
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(200).send(users);
    // check if galerie exist
    // check if user have subscribe to this galerie
    // return all users to this galerie (limit 20)
  }); // get all user from a galerie
  router.post('/', passport.authenticate('jwt', { session: false }), postGaleries); // DONE
  router.post('/:id/frames', passport.authenticate('jwt', { session: false }), uploadFiles, postGaleriesIdFrames); // DONE
  router.put('/:id', passport.authenticate('jwt', { session: false }), putGaleriesId); // DONE
  router.put('/:id/frames/:id', () => {
    // Need to create model Like
    // if user haven't like this frame add a frame
    // if user has already like this frame, delete this frame
  }); // like or unlike a galerie
  router.put('/subscribe/', () => {
    // Create a model Subscription
    // need token
    // check if token is valid
    // check if token.id is a valid galerie.id
    // check if user is not a subscriber of this galerie
    // add user to this galerie
    // delete the invitation (remove 1 to invitation.numberOfInvitation)
  }); // subscribe to a galerie
  router.put('/:id/unsubscribe/', () => {
    // check if galerie exist
    // check if user is subscribe to this galerie
    // remove galerieUser to this galerie
    // remove all frame upload by this user
  }); // unsubscribe to a galerie
  router.put('/:id/users/:userId', () => {
    // check if galerie exist
    // check if user is creator or admin
    // check if user userId exist
    // check if user userId is subscribe to this galerie
    // remove this user to the galerie
    // destroy all frames updloaded by this user
  }); // remove user from a galerie
  // put user role admin/user if current user is creator/admin
  return router;
};

export default galeriesRoutes;
