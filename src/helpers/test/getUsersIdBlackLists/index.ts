import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  token: string,
  userId: string,
  option: {
    previousBlackList?: string;
  } = {},
) => {
  let response: request.Response;
  if (option.previousBlackList) {
    response = await request(app)
      .get(`/users/${userId}/blackLists?previousBlackList=${option.previousBlackList}`)
      .set('authorization', token);
  } else {
    response = await request(app)
      .get(`/users/${userId}/blackLists`)
      .set('authorization', token);
  }
  return response;
};
