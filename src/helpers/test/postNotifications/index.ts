import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  option: {
    notificationtoken?: string,
  } = {},
) => {
  let response: request.Response;
  if (option.notificationtoken) {
    response = await request(app)
      .post('/notifications/')
      .set('notificationtoken', option.notificationtoken);
  } else {
    response = await request(app)
      .post('/notifications/');
  }
  return response;
};
