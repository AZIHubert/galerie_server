import {
  Request,
  Response,
} from 'express';

import {
  DEFAULT_ERROR_MESSAGE,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';
import { Report } from '#src/db/models';

export default async (req: Request, res: Response) => {
  const {
    reportId,
  } = req.params;
  let report: Report | null;

  if (!uuidValidateV4(reportId)) {
    return res.status(400).send({
      errors: INVALID_UUID('report'),
    });
  }

  try {
    report = await Report.findByPk(reportId);
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!report) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('report'),
    });
  }

  if (!report.frameId && !report.profilePictureId) {
    try {
      await report.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(500).send({
      errors: DEFAULT_ERROR_MESSAGE,
    });
  }

  if (report.classed) {
    return res.status(400).send({
      errors: 'this report is already classed',
    });
  }

  try {
    await report.update({ classed: true });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      reportId,
      classed: true,
    },
  });
};
