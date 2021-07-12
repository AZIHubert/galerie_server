import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  Report,
  ReportUser,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { reason } = req.body;
  const {
    frameId,
  } = req.params;
  const currentUser = req.user as User;
  let frame: Frame | null;
  let report: Report | null;

  if (currentUser.role !== 'user') {
    return res.status(400).send({
      errors: 'you are not allow to report this frame',
    });
  }

  // Check if request.params.frameId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  // Fetch galerie.
  try {
    frame = await Frame.findByPk(frameId, {
      include: [
        {
          include: [
            {
              model: User,
              required: true,
              where: {
                id: currentUser.id,
              },
            },
          ],
          required: true,
          model: Galerie,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if frame exist.
  if (!frame) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  if (currentUser.id === frame.userId) {
    return res.status(400).send({
      errors: 'you are not allow to report your own frame',
    });
  }

  if (frame.galerie.users[0].GalerieUser.role === 'admin') {
    return res.status(400).send({
      errors: 'you are not allow to report this frame',
    });
  }

  // Fetch report.
  try {
    report = await Report.findOne({
      include: [
        {
          model: User,
          required: false,
          where: {
            id: currentUser.id,
          },
        },
      ],
      where: {
        frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if request.body.reason is valid.
  if (
    reason !== 'disinformation'
    && reason !== 'harassment'
    && reason !== 'hate'
    && reason !== 'intellectual property'
    && reason !== 'nudity'
    && reason !== 'scam'
  ) {
    return res.status(400).send({
      errors: {
        reason: 'invalid reason',
      },
    });
  }

  // If report exist...
  if (report) {
    // ...and user already report this frame
    // return an error.
    if (report.users[0]) {
      return res.status(400).send({
        errors: 'you have already report this frame',
      });
    }
    // ...create a ReportUser
    // and increment numOfReports.
    try {
      await ReportUser.create({
        reportId: report.id,
        userId: currentUser.id,
      });
      // TODO:
      // create a reportedFrameUser
      await report.update({
        classed: false,
        numOfReports: report.numOfReports + 1,
        reasonDisinformation: reason === 'disinformation'
          ? report.reasonDisinformation + 1
          : report.reasonDisinformation,
        reasonHarassment: reason === 'harassment'
          ? report.reasonHarassment + 1
          : report.reasonHarassment,
        reasonHate: reason === 'hate'
          ? report.reasonHate + 1
          : report.reasonHate,
        reasonIntellectualPropery: reason === 'intellectual property'
          ? report.reasonIntellectualPropery + 1
          : report.reasonIntellectualPropery,
        reasonNudity: reason === 'nudity'
          ? report.reasonNudity + 1
          : report.reasonNudity,
        reasonScam: reason === 'scam'
          ? report.reasonScam + 1
          : report.reasonScam,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  // If no report for this frame exist,
  // create a report for this frame.
  } else {
    try {
      const { id: reportId } = await Report.create({
        frameId,
        reasonDisinformation: reason === 'disinformation' ? 1 : 0,
        reasonHarassment: reason === 'harassment' ? 1 : 0,
        reasonHate: reason === 'hate' ? 1 : 0,
        reasonIntellectualPropery: reason === 'intellectual property' ? 1 : 0,
        reasonNudity: reason === 'nudity' ? 1 : 0,
        reasonScam: reason === 'scam' ? 1 : 0,
      });
      // TODO:
      // create a reportedFrameUser
      await ReportUser.create({
        reportId,
        userId: currentUser.id,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      frameId,
      galerieId: frame.galerieId,
    },
  });
};
