import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  blackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

export default async (req: Request, res: Response) => {
  const {
    direction: queryDirection,
    page,
  } = req.query;
  const limit = 20;
  const returnedBlackLists: Array<any> = [];
  let blackLists: Array<BlackList>;
  let direction = 'DESC';
  let offset: number;

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

  try {
    // Get all black listed user
    blackLists = await BlackList.findAll({
      attributes: {
        exclude: blackListExcluder,
      },
      include: [
        {
          as: 'user',
          attributes: {
            exclude: userExcluder,
          },
          model: User,
        },
        {
          as: 'admin',
          attributes: {
            exclude: userExcluder,
          },
          model: User,
        },
      ],
      limit,
      offset,
      order: [['createdAt', direction]],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    // Get black listed user's current profile picture
    // with their signed url.
    await Promise.all(
      blackLists.map(async (blackList) => {
        // Check if blackList.user exist
        if (!blackList.user) {
          await blackList.destroy();
        } else {
          // Check if black list is expired.
          const time = new Date(
            blackList.createdAt.setMilliseconds(
              blackList.createdAt.getMilliseconds() + blackList.time,
            ),
          );
          const blackListIsExpired = time > new Date(Date.now());

          if (blackListIsExpired) {
            await blackList.destroy();
          } else {
            // Fetch user and admin current profile picture.
            const currentProfilePicture = await fetchCurrentProfilePicture(blackList.user);
            let adminCurrentProfilePicture;
            if (blackList.admin) {
              adminCurrentProfilePicture = await fetchCurrentProfilePicture(blackList.admin);
            }

            const returnedBlackList = {
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

            returnedBlackLists.push(returnedBlackList);
          }
        }
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      blackLists: returnedBlackLists,
    },
  });
};
