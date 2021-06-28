export default (
  ticket: any,
  refTicket?: any,
) => {
  expect(ticket.updatedAt).toBeUndefined();
  expect(ticket.userId).toBeUndefined();
  if (refTicket) {
    expect(ticket.autoIncrementId).toBe(refTicket.autoIncrementId);
    expect(ticket.body).toBe(refTicket.body);
    expect(new Date(ticket.createdAt)).toEqual(new Date(refTicket.createdAt));
    expect(ticket.header).toBe(refTicket.header);
    expect(ticket.id).toBe(refTicket.id);
  } else {
    expect(ticket.autoIncrementId).not.toBeUndefined();
    expect(ticket.body).not.toBeUndefined();
    expect(ticket.createdAt).not.toBeUndefined();
    expect(ticket.header).not.toBeUndefined();
    expect(ticket.id).not.toBeUndefined();
    expect(ticket.user).not.toBeUndefined();
  }
};
