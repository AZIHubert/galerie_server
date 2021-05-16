import {
  Request,
  Response,
} from 'express';

import { BlackList } from '@src/db/models';

export default async (req: Request, res: Response) => {
  const { blackListId } = req.params;
  let blackList: BlackList | null;

  // Fetch black list.
  try {
    blackList = await BlackList.findByPk(blackListId);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if black list exist.
  if (!blackList) {
    return res.status(404).send({
      errors: 'black list not found',
    });
  }

  // Destroy blacklist.
  try {
    await blackList.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      blackListId,
    },
  });
};
