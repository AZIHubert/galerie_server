import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  body: {
    email?: string;
    id?: string;
    profilePicture?: string;
    type?: 'Facebook' | 'Google';
    userName?: string;
  },
) => {
  const response = await request(app)
    .post('/users/login/socialMedia')
    .send(body);
  return response;
};
