import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    previousTicket?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.previousTicket) {
    response = await request(app)
      .get(`/tickets?previousTicket=${option.previousTicket}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get('/tickets/')
      .set('authorization', token);
  }
  return response;
};
