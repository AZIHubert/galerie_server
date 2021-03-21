import { Router } from 'express';

import {
  uploadFiles,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Like,
  User,
} from '@src/db/models';

import {
  deleteGaleriesIdFramesId,
  deleteGaleriesIdInvitationsId,
  deleteGaleriesIdUnsubscribe,
  deleteGaleriesIdUsersUserId,
  getGaleries,
  getGaleriesId,
  getGaleriesIdFrames,
  getGaleriesIdFramesId,
  getGaleriesIdInvitations,
  getGaleriesIdInvitationsId,
  getGaleriesIdUsers,
  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  putGaleriesId,
  putGaleriesIdUsersUserId,
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
  router.delete('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdFramesId);
  router.delete('/:id/unsubscribe/', passport.authenticate('jwt', { session: false }), deleteGaleriesIdUnsubscribe);
  router.delete('/:id/users/:userId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdUsersUserId);
  router.delete('/:id/invitations/:invitationId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdInvitationsId);
  router.get('/', passport.authenticate('jwt', { session: false }), getGaleries);
  router.get('/:id', passport.authenticate('jwt', { session: false }), getGaleriesId);
  router.get('/:id/frames/', passport.authenticate('jwt', { session: false }), getGaleriesIdFrames);
  router.get('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), getGaleriesIdFramesId);
  router.get('/:id/invitations', passport.authenticate('jwt', { session: false }), getGaleriesIdInvitations);
  router.get('/:id/invitations/:invitationId', passport.authenticate('jwt', { session: false }), getGaleriesIdInvitationsId);
  router.get('/:id/users', passport.authenticate('jwt', { session: false }), getGaleriesIdUsers);
  router.post('/', passport.authenticate('jwt', { session: false }), postGaleries);
  router.post('/:id/frames', passport.authenticate('jwt', { session: false }), uploadFiles, postGaleriesIdFrames);
  router.post('/:id/invitations', passport.authenticate('jwt', { session: false }), postGaleriesIdInvitations);
  router.put('/:id', passport.authenticate('jwt', { session: false }), putGaleriesId);
  router.put('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { id: userId } = req.user as User;
    const { id: galerieId, frameId } = req.params;
    let galerie: Galerie | null;
    let frame: Frame | null;
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
      frame = await Frame.findOne({
        where: {
          id: frameId,
          galerieId,
        },
        include: [{
          model: GaleriePicture,
        }],
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    if (!frame) {
      return res.status(404).send({
        errors: 'frame not found',
      });
    }
    try {
      const like = await Like.findOne({
        where: {
          userId,
          frameId,
        },
      });
      if (like) {
        await like.destroy();
      } else {
        await Like.create({
          userId,
          frameId,
        });
      }
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(204).end();
  });
  router.put('/subscribe/', () => {
    // Create a model Subscription
    // need token
    // check if token is valid
    // check if token.id is a valid galerie.id
    // check if user is not a subscriber of this galerie
    // add user to this galerie
    // delete the invitation (remove 1 to invitation.numberOfInvitation)
  }); // subscribe to a galerie
  router.put('/:id/users/:userId', passport.authenticate('jwt', { session: false }), putGaleriesIdUsersUserId);
  return router;
};

export default galeriesRoutes;
