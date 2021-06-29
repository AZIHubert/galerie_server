import {
  Report,
  ReportUser,
} from '#src/db/models';

export default async ({
  classed,
  frameId,
  numOfReports,
  userId,
}: {
  classed?: boolean;
  frameId: string;
  numOfReports?: number;
  userId?: string;
}) => {
  const report = await Report.create({
    frameId,
  });
  if (userId) {
    await ReportUser.create({
      classed: classed || false,
      reportId: report.id,
      numOfReports: numOfReports || 1,
      userId,
    });
  }
  return report;
};
