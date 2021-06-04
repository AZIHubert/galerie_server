import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  ticketId: string,
) => {
  const response = await request(app)
    .delete(`/tickets/${ticketId}`)
    .set('authorization', token);
  return response;
};
