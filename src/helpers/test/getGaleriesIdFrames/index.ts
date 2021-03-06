import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  galerieId: string,
  option: {
    previousFrame?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.previousFrame) {
    response = await request(app)
      .get(`/galeries/${galerieId}/frames/?previousFrame=${option.previousFrame}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/galeries/${galerieId}/frames/`)
      .set('authorization', token);
  }
  return response;
};
