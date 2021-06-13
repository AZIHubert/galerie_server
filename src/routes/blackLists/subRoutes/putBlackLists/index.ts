import {
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  BlackList,
} from '@src/db/models';

export default async (_: any, res: Response) => {
  try {
    await BlackList.update({
      active: false,
    }, {
      where: {
        active: true,
        time: {
          [Op.lt]: new Date(Date.now()),
        },
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(204).send();
};
