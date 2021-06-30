import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  ProfilePicture,
  Report,
} from '#src/db/models';

import {
  DEFAULT_ERROR_MESSAGE,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  reportExcluder,
} from '#src/helpers/excluders';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    reportId,
  } = req.params;
  let report: Report | null;
  let normalizeReport: any;

  if (!uuidValidateV4(reportId)) {
    return res.status(400).send({
      errors: INVALID_UUID('report'),
    });
  }

  try {
    report = await Report.findByPk(reportId, {
      attributes: {
        exclude: reportExcluder,
      },
      include: [
        {
          attributes: {
            exclude: [
              'notificationHasBeenSend',
              'updatedAt',
            ],
          },
          model: Frame,
        },
        {
          attributes: {
            exclude: [
              'cropedImageId',
              'originalImageId',
              'pendingImageId',
              'updatedAt',
            ],
          },
          model: ProfilePicture,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!report) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('report'),
    });
  }

  if (!report.frame && !report.profilePicture) {
    try {
      await report.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(500).send({
      errors: DEFAULT_ERROR_MESSAGE,
    });
  }

  if (report.frame) {
    normalizeReport = {
      ...report.toJSON(),
      frame: {
        ...report.frame.toJSON(),
      },
      profilePicture: undefined,
      type: 'FRAME',
    };
  } else {
    normalizeReport = {
      ...report.toJSON(),
      frame: undefined,
      profilePicture: {
        ...report.profilePicture.toJSON(),
      },
      type: 'PROFILE_PICTURE',
    };
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      report: normalizeReport,
    },
  });
};
