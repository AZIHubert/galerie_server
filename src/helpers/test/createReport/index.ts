import {
  Report,
  ReportUser,
} from '#src/db/models';

export default async ({
  frameId,
  numOfReports,
  userId,
}: {
  frameId: string;
  numOfReports?: number;
  userId?: string;
}) => {
  const report = await Report.create({
    frameId,
  });
  if (userId) {
    await ReportUser.create({
      reportId: report.id,
      numOfReports: numOfReports || 1,
      userId,
    });
  }
  return report;
};
