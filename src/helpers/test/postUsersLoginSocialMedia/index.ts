import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  option: {
    body: {
      email?: string;
      id?: string;
      profilePicture?: string;
      type?: 'Facebook' | 'Google';
      userName?: string;
    },
  } = {
    body: {},
  },
) => {
  const response = await request(app)
    .post('/users/login/socialMedia')
    .send(option.body);
  return response;
};
