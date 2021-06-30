// POST /galeries/:galerieId/frames/:frameId/likes/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  Like,
  Notification,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import { signNotificationToken } from '#src/helpers/issueJWT';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
  } = req.params;
  const currentUser = req.user as User;
  let like: Like | null;
  let liked: boolean;
  let notificationToken;
  let frame: Frame | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  // Fetch galerie.
  try {
    frame = await Frame.findByPk(frameId, {
      include: [
        {
          include: [
            {
              model: User,
              required: true,
              where: {
                id: currentUser.id,
              },
            },
          ],
          required: true,
          model: Galerie,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if frame exist
  if (!frame) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  // Fetch like.
  try {
    like = await Like.findOne({
      where: {
        frameId,
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  if (like) {
    let notification: Notification | null;
    // Destroy like
    try {
      await like.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }

    // Decrement frame.numOfLikes.
    try {
      await frame.decrement({ numOfLikes: 1 });
    } catch (err) {
      return res.status(500).send(err);
    }
    liked = false;

    // Fetch notification where
    // type === 'FRAME_LIKED',
    // frameId === request.params.frameId
    // and frameLiked.userId === currentUser.id
    try {
      notification = await Notification.findOne({
        include: [
          {
            as: 'notificationsFrameLiked',
            model: User,
            where: {
              id: currentUser.id,
            },
          },
        ],
        where: {
          frameId,
          type: 'FRAME_LIKED',
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }

    // If notification.num <= 1 destroy notification,
    // else, decrement num and destroy through model.
    if (notification) {
      if (notification.num <= 1) {
        try {
          await notification.destroy();
        } catch (err) {
          return res.status(500).send(err);
        }
      } else {
        try {
          await notification.decrement({ num: 1 });
          await notification.notificationsFrameLiked[0].destroy();
        } catch (err) {
          return res.status(500).send(err);
        }
      }
    }

  // ...else, create a Like,
  // increment frame.numOfLike
  // and create notificationToken.
  } else {
    let likeId: string;

    try {
      const createdLike = await Like.create({
        frameId,
        userId: currentUser.id,
      });
      likeId = createdLike.id;
      await frame.increment({ numOfLikes: 1 });
    } catch (err) {
      return res.status(500).send(err);
    }
    liked = true;
    if (frame.userId !== currentUser.id) {
      const signToken = signNotificationToken('FRAME_LIKED', {
        likeId,
      });
      notificationToken = signToken.token;
    }
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      frameId,
      galerieId: frame.galerieId,
      liked,
      notificationToken,
      numOfLikes: frame.numOfLikes,
    },
  });
};
