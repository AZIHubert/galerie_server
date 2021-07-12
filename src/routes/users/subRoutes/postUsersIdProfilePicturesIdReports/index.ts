import {
  Request,
  Response,
} from 'express';

import {
  User,
  ProfilePicture,
  Report,
  ReportUser,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { reason } = req.body;
  const {
    profilePictureId,
    userId,
  } = req.params;
  const currentUser = req.user as User;
  let report: Report | null;
  let user: User | null;

  if (currentUser.role !== 'user') {
    return res.status(400).send({
      errors: 'you are not allow to report this profile picture',
    });
  }

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(profilePictureId)) {
    return res.status(400).send({
      errors: INVALID_UUID('profile picture'),
    });
  }

  if (currentUser.id === userId) {
    return res.status(400).send({
      errors: 'you can\'t report your own profile pictures',
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId, {
      include: [
        {
          model: ProfilePicture,
          required: false,
          where: {
            id: profilePictureId,
          },
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // Check if profile picture exist
  if (!user.profilePictures[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('profile picture'),
    });
  }

  // Fetch report.
  try {
    report = await Report.findOne({
      include: [
        {
          as: 'users',
          model: User,
          required: false,
          where: {
            id: currentUser.id,
          },
        },
      ],
      where: {
        profilePictureId,
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
        errors: 'you have already report this profile picture',
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
      // create a reportedProfilePictureUser
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
  // create a report for this profile picture.
  } else {
    try {
      const { id: reportId } = await Report.create({
        profilePictureId,
        reasonDisinformation: reason === 'disinformation' ? 1 : 0,
        reasonHarassment: reason === 'harassment' ? 1 : 0,
        reasonHate: reason === 'hate' ? 1 : 0,
        reasonIntellectualPropery: reason === 'intellectual property' ? 1 : 0,
        reasonNudity: reason === 'nudity' ? 1 : 0,
        reasonScam: reason === 'scam' ? 1 : 0,
      });
      // TODO:
      // create a reportedProfilePictureUser
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
      userId,
      profilePictureId,
    },
  });
};
