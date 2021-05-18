import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  confirmToken?: string,
) => {
  let response: request.Response;
  if (confirmToken) {
    response = await request(app)
      .put('/users/confirmation')
      .set('confirmation', confirmToken);
  } else {
    response = await request(app)
      .put('/users/confirmation');
  }
  return response;
};
