import {
  Report,
  ReportUser,
} from '#src/db/models';

export default async ({
  classed,
  frameId,
  numOfReports,
  profilePictureId,
  userId,
}: {
  classed?: boolean;
  frameId?: string;
  numOfReports?: number;
  profilePictureId?: string;
  reason?: string;
  userId?: string;
}) => {
  const report = await Report.create({
    classed: classed || false,
    frameId,
    numOfReports: numOfReports || 1,
    profilePictureId,
  });
  if (userId) {
    await ReportUser.create({
      reportId: report.id,
      userId,
    });
  }
  return report;
};
