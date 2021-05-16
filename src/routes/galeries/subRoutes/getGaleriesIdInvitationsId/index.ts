import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  Invitation,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  invitationExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const {
    galerieId,
    invitationId,
  } = req.params;
  let currentProfilePicture;
  let galerie: Galerie | null;
  let invitation: Invitation | null;
  let invitationHasExpired = false;
  let userIsBlackListed: boolean;

  // Fetch galerie.
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

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Check if user'role for this galerie
  // is not 'user'.
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to fetch the invitation',
    });
  }

  // Fetch invitation.
  try {
    invitation = await Invitation.findOne({
      attributes: {
        exclude: invitationExcluder,
      },
      include: [{
        attributes: {
          exclude: userExcluder,
        },
        model: User,
      }],
      where: {
        id: invitationId,
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if invitation exist.
  if (!invitation) {
    return res.status(404).send({
      errors: 'invitation not found',
    });
  }

  // Check if invitation is expired.
  if (invitation.time) {
    const time = new Date(
      invitation.createdAt.setMilliseconds(
        invitation.createdAt.getMilliseconds() + invitation.time,
      ),
    );
    invitationHasExpired = time > new Date(Date.now());
  }

  // If this invitation is expired,
  // destroy it and return a 404 error.
  if (invitationHasExpired) {
    try {
      await invitation.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(404).send({
      errors: 'invitation not found',
    });
  }

  // Check if user is black listed.
  try {
    userIsBlackListed = await checkBlackList(invitation.user);
  } catch (err) {
    return res.status(500).send(err);
  }

  // If user is black listed
  // there no need to fetch
  // current profile picture,
  // invitation.user = null.
  if (!userIsBlackListed) {
    currentProfilePicture = await fetchCurrentProfilePicture(invitation.user);
  }

  const returnedInvitation = {
    ...invitation.toJSON(),
    user: !userIsBlackListed ? {
      ...invitation.user.toJSON(),
      currentProfilePicture,
    } : null,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      invitation: returnedInvitation,
    },
  });
};
