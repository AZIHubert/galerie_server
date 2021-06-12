// GET /blackLists/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  blackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

// TODO:
// when there are more than 20 blackLists
// and at a fetch, one of then is destroy
// because of its expire time,
// when a user request the next page of
// blackList, one of then gonna be skiped.

// Solutions
// Return black list with a field expired: boolean.

// Store date directly in blackList.time (not juste number)
// Then return blackList if date.today is gretter or lower (not sure) than blackList.time.
// Do the same thing for invitation.date.

// Probleme.
// When do delete expired blackLists/invitations?
// Solution
// Create a route DELETE /blackLists/expired.
// When BlackList is required by app, trigger this route to.
// Create a route DELETE /galeries/:galerieId/invitations/expired.
// When Invitations of galerie with galerieId is required by app, trigger this route to.

// When Users are required, if the 20 of them are blacklisted
// GET users return nothing.

// Solution
// Return all users with a label user.isBlackListed
// Before, only admin/superAdmin was able to see blacklisted user.
// or return black listed users as an empty object (or just 'null')
// for user.role === 'user'.

export default async (req: Request, res: Response) => {
  const {
    direction: queryDirection,
    page,
  } = req.query;
  const limit = 20;
  let blackLists: Array<BlackList>;
  let direction = 'DESC';
  let offset: number;
  let returnedBlackLists: Array<any> = [];

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }

  // Fetch blackLists.
  try {
    blackLists = await BlackList.findAll({
      attributes: {
        exclude: blackListExcluder,
      },
      include: [
        {
          as: 'admin',
          attributes: {
            exclude: userExcluder,
          },
          model: User,
        },
        {
          as: 'user',
          attributes: {
            exclude: userExcluder,
          },
          model: User,
        },
      ],
      limit,
      offset,
      order: [['createdAt', direction]],
      where: {
        active: true,
        [Op.or]: [
          {
            time: {
              [Op.gte]: new Date(Date.now()),
            },
          },
          {
            time: null,
          },
        ],
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    // Get black listed user's current profile picture
    // with their signed url.
    returnedBlackLists = await Promise.all(
      blackLists.map(async (blackList) => {
        const currentProfilePicture = await fetchCurrentProfilePicture(blackList.user);
        let adminCurrentProfilePicture;

        if (blackList.admin) {
          adminCurrentProfilePicture = await fetchCurrentProfilePicture(blackList.admin);
        }

        return {
          ...blackList.toJSON(),
          admin: blackList.admin ? {
            ...blackList.admin.toJSON(),
            currentProfilePicture: adminCurrentProfilePicture,
          } : null,
          user: {
            ...blackList.user.toJSON(),
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
      blackLists: returnedBlackLists.filter((b) => !!b),
    },
  });
};
