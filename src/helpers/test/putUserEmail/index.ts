import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  confirmToken: string | undefined,
  {
    password,
  } : {
    password?: any
  },
) => {
  let response: request.Response;
  if (confirmToken) {
    response = await request(app)
      .put('/users/me/email/')
      .set('authorization', token)
      .set('confirmation', confirmToken)
      .send({
        password,
      });
  } else {
    response = await request(app)
      .put('/users/me/email/')
      .set('authorization', token)
      .send({
        password,
      });
  }
  return response;
};
