export default (
  report: any,
  refReport?: any,
) => {
  expect(report.frameId).toBeUndefined();
  expect(report.profilePictureId).toBeUndefined();
  expect(report.type).not.toBeUndefined();
  if (refReport) {
    expect(report.autoIncrementId).toBe(refReport.autoIncrementId);
    expect(report.classed).toBe(refReport.classed);
    expect(new Date(report.createdAt)).toEqual(new Date(refReport.createdAt));
    expect(report.id).toBe(refReport.id);
    expect(report.numOfReports).toBe(refReport.numOfReports);
    expect(report.reasonDisinformation).toBe(refReport.reasonDisinformation);
    expect(report.reasonHarassment).toBe(refReport.reasonHarassment);
    expect(report.reasonHate).toBe(refReport.reasonHate);
    expect(report.reasonIntellectualPropery).toBe(refReport.reasonIntellectualPropery);
    expect(report.reasonNudity).toBe(refReport.reasonNudity);
    expect(report.reasonScam).toBe(refReport.reasonScam);
    expect(new Date(report.updatedAt)).toEqual(new Date(refReport.updatedAt));
  } else {
    expect(report.autoIncrementId).not.toBeUndefined();
    expect(report.classed).not.toBeUndefined();
    expect(report.createdAt).not.toBeUndefined();
    expect(report.id).not.toBeUndefined();
    expect(report.numOfReports).not.toBeUndefined();
    expect(report.reasonDisinformation).not.toBeUndefined();
    expect(report.reasonHarassment).not.toBeUndefined();
    expect(report.reasonHate).not.toBeUndefined();
    expect(report.reasonIntellectualPropery).not.toBeUndefined();
    expect(report.reasonNudity).not.toBeUndefined();
    expect(report.reasonScam).not.toBeUndefined();
    expect(report.updatedAt).not.toBeUndefined();
  }
};
