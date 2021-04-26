import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  confirmToken: string | undefined,
  body: {
    email?: any;
    password?: any;

  },
) => {
  let response: request.Response;
  if (confirmToken) {
    response = await request(app)
      .post('/users/me/email/confirm')
      .set('authorization', token)
      .set('confirmation', confirmToken)
      .send(body);
  } else {
    response = await request(app)
      .post('/users/me/email/confirm')
      .set('authorization', token)
      .send(body);
  }
  return response;
};
