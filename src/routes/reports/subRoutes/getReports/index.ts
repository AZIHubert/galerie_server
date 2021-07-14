import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  ProfilePicture,
  Report,
} from '#src/db/models';

import {
  reportExcluder,
} from '#src/helpers/excluders';
import isNormalInteger from '#src/helpers/isNormalInteger';

export default async (req: Request, res: Response) => {
  const {
    classed,
    previousReport,
  } = req.query;
  const limit = 20;
  const where: {
    classed?: any;
    autoIncrementId?: any;
  } = {};
  let normalizeReports: any[];
  let reports: Report[];

  switch (classed) {
    case 'true':
      where.classed = {
        [Op.eq]: true,
      };
      break;
    case 'false':
      where.classed = {
        [Op.eq]: false,
      };
      break;
    default:
      break;
  }
  if (previousReport && isNormalInteger(previousReport.toString())) {
    where.autoIncrementId = {
      [Op.gt]: previousReport.toString(),
    };
  }

  try {
    reports = await Report.findAll({
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
              'updatedAt',
            ],
          },
          model: ProfilePicture,
        },
      ],
      limit,
      order: [['autoIncrementId', 'ASC']],
      where: {
        ...where,
        [Op.or]: [
          {
            frameId: {
              [Op.not]: null,
            },
          },
          {
            profilePictureId: {
              [Op.not]: null,
            },
          },
        ],
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    normalizeReports = await Promise.all(
      reports.map(
        async (report) => {
          if (report.frame) {
            return {
              ...report.toJSON(),
              frame: {
                ...report.frame.toJSON(),
              },
              profilePicture: undefined,
              type: 'FRAME',
            };
          }
          return {
            ...report.toJSON(),
            frame: undefined,
            profilePicture: {
              ...report.profilePicture.toJSON(),
            },
            type: 'PROFILE_PICTURE',
          };
        },
      ),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      reports: normalizeReports,
    },
  });
};
