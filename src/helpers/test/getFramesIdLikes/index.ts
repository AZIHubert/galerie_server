import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  frameId: string,
  option: {
    previousLike?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.previousLike) {
    response = await request(app)
      .get(`/frames/${frameId}/likes/?previousLike=${option.previousLike}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/frames/${frameId}/likes/`)
      .set('authorization', token);
  }
  return response;
};
