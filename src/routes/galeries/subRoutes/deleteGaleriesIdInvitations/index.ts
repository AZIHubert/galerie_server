import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Galerie,
  Invitation,
} from '@src/db/models';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
  } = req.params;
  let expiredInvitations: Array<Invitation>;

  try {
    expiredInvitations = await Invitation.findAll({
      include: [
        {
          model: Galerie,
          where: {
            id: galerieId,
          },
        },
      ],
      where: {
        [Op.or]: [
          {
            numOfInvits: {
              [Op.lt]: 1,
            },
          },
          {
            time: {
              [Op.lte]: new Date(Date.now()),
            },
          },
        ],
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    await Promise.all(
      expiredInvitations.map(async (invitation) => {
        await invitation.destroy();
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(204).send();
};
