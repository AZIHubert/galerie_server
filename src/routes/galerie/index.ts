import { Router } from 'express';

import {
  uploadFiles,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  Galerie,
  GalerieUser,
  User,
} from '@src/db/models';

import {
  deleteGaleriesIdFramesId,
  getGaleries,
  getGaleriesId,
  getGaleriesIdFrames,
  getGaleriesIdFramesId,
  getGaleriesIdUsers,
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
  router.get('/:id/users', passport.authenticate('jwt', { session: false }), getGaleriesIdUsers); // DONE
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
  router.delete('/:id/users/:userId', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const { id: userId } = req.user as User;
    const { id: galerieId, userId: UId } = req.params;
    let galerie: Galerie | null;
    if (userId === UId) {
      return res.status(400).send({
        errors: 'you cannot delete yourself',
      });
    }
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
    const { role } = galerie
      .users
      .filter((user) => user.id === userId)[0]
      .GalerieUser;
    let user: User | null;
    if (role === 'user') {
      return res.status(400).send({
        errors: 'you should be an admin or the creator to this galerie to delete a user',
      });
    }
    try {
      user = await User.findOne({
        where: {
          id: UId,
        },
        include: [{
          model: Galerie,
          where: {
            id: galerieId,
          },
        }],
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    if (!user) {
      return res.status(404).send({
        errors: 'user not found',
      });
    }
    if (user.GalerieUser.role === 'creator') {
      return res.status(400).send({
        errors: 'you can\'t delete the creator of this galerie',
      });
    }
    if (
      user.GalerieUser.role === 'admin'
      && role !== 'creator'
    ) {
      return res.status(400).send({
        errors: 'you should be the creator of this galerie to delete an admin',
      });
    }
    try {
      await GalerieUser.destroy({
        where: {
          userId: UId,
          galerieId,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(200).end({
      userId: UId,
      galerieId,
    });
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
