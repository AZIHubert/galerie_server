// GET /galeries/:galerieId/invitations/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Galerie,
  Invitation,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  invitationExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import { fetchCurrentProfilePicture } from '@root/src/helpers/fetch';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const { page } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  const objectUserExcluder: { [key: string]: undefined } = {};
  let galerie: Galerie | null;
  let invitations: Array<Invitation>;
  let offset: number;
  let returnedInvitations: Array<any>;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

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
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Check if user role for this galerie
  // is not 'user'.
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to fetch the invitations',
    });
  }

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  // Fetch all invitations.
  try {
    invitations = await Invitation.findAll({
      attributes: {
        exclude: invitationExcluder,
      },
      include: [{
        model: User,
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              {
                numOfInvits: {
                  [Op.gt]: 0,
                },
              },
              {
                numOfInvits: {
                  [Op.eq]: null,
                },
              },
            ],
          },
          {
            [Op.or]: [
              {
                time: {
                  [Op.gt]: new Date(Date.now()),
                },
              },
              {
                time: null,
              },
            ],
          },
        ],
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Normalize all invitations.
  try {
    returnedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        let currentProfilePicture;
        const userIsBlackListed = await checkBlackList(invitation.user);

        if (!userIsBlackListed) {
          currentProfilePicture = await fetchCurrentProfilePicture(invitation.user);
          userExcluder.forEach((e) => {
            objectUserExcluder[e] = undefined;
          });
        }

        return {
          ...invitation.toJSON(),
          user: userIsBlackListed ? null : {
            ...invitation.user.toJSON(),
            ...objectUserExcluder,
            currentProfilePicture,
          },
        };
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      invitations: returnedInvitations,
    },
  });
};
