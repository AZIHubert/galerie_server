import { Op } from 'sequelize';

import {
  Frame,
  Notification,
  GalerieUser,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

interface Error {
  OK: false;
  errors: any;
  status: number;
}
interface Success {
  OK: true;
}

export default async ({
  frameId,
}: {
  frameId?: any;
}) => {
  let frame: Frame | null;
  let galerieUsers: GalerieUser[];

  // Check if request.body.userId is a UUIDv4.
  if (!uuidValidateV4(frameId)) {
    return {
      OK: false,
      errors: INVALID_UUID('frame'),
      status: 400,
    } as Error;
  }

  try {
    frame = await Frame.findByPk(frameId);
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  if (!frame) {
    return {
      OK: false,
      errors: MODEL_NOT_FOUND('frame'),
      status: 404,
    } as Error;
  }

  if (frame.notificationHasBeenSend) {
    return {
      OK: false,
      errors: 'notifications already send for this frame',
      status: 400,
    } as Error;
  }

  try {
    await frame.update({
      notificationHasBeenSend: true,
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  try {
    galerieUsers = await GalerieUser.findAll({
      where: {
        galerieId: frame.galerieId,
        userId: {
          [Op.not]: frame.userId,
        },
      },
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  if (!galerieUsers.length) {
    return { OK: true } as Success;
  }

  try {
    await Promise.all(
      galerieUsers.map(
        async (galerieUser) => {
          const notification = await Notification.findOne({
            where: {
              galerieId: frame!.galerieId,
              type: 'FRAME_POSTED',
              userId: galerieUser.userId,
            },
          });
          if (notification) {
            await notification.increment({ num: 1 });
          } else {
            await Notification.create({
              galerieId: frame!.galerieId,
              num: 1,
              type: 'FRAME_POSTED',
              userId: galerieUser.userId,
            });
          }
        },
      ),
    );
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  return { OK: true } as Success;
};
