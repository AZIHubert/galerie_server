export default (
  report: any,
  refReport?: any,
) => {
  expect(report.frameId).toBeUndefined();
  expect(report.profilePictureId).toBeUndefined();
  if (refReport) {
    expect(report.autoIncrementId).toBe(refReport.autoIncrementId);
    expect(report.classed).toBe(refReport.classed);
    expect(new Date(report.createdAt)).toEqual(new Date(refReport.createdAt));
    expect(report.id).toBe(refReport.id);
    expect(report.numOfReports).toBe(refReport.numOfReports);
    expect(report.type).toBe(refReport.type);
    expect(new Date(report.updatedAt)).toEqual(new Date(refReport.updatedAt));
  } else {
    expect(report.autoIncrementId).not.toBeUndefined();
    expect(report.classed).not.toBeUndefined();
    expect(report.createdAt).not.toBeUndefined();
    expect(report.id).not.toBeUndefined();
    expect(report.numOfReports).not.toBeUndefined();
    expect(report.type).not.toBeUndefined();
    expect(report.updatedAt).not.toBeUndefined();
  }
};
