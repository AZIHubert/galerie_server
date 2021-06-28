import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  option: {
    previousNotification?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.previousNotification) {
    response = await request(app)
      .get(`/notifications?previousNotification=${option.previousNotification}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get('/notifications/')
      .set('authorization', token);
  }
  return response;
};
