import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  option: {
    previousUser?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.previousUser) {
    response = await request(app)
      .get(`/galeries/${galerieId}/users/?previousUser=${option.previousUser}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/galeries/${galerieId}/users/`)
      .set('authorization', token);
  }
  return response;
};
