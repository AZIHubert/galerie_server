import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  confirmToken: string | undefined,
  {
    email,
    password,
  } : {
    email?: any;
    password?: any;

  },
) => {
  let response: request.Response;
  if (confirmToken) {
    response = await request(app)
      .post('/users/me/updateEmail/confirm')
      .set('authorization', token)
      .set('confirmation', confirmToken)
      .send({
        email,
        password,
      });
  } else {
    response = await request(app)
      .post('/users/me/updateEmail/confirm')
      .set('authorization', token)
      .send({
        email,
        password,
      });
  }
  return response;
};
