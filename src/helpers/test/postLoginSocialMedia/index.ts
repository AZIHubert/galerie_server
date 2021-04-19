import { Server } from 'http';
import request from 'supertest';

export default async (
  app: Server,
  {
    email,
    id,
    profilePicture,
    type = 'Facebook',
    userName,
  } : {
    email?: string;
    id?: string;
    profilePicture?: string;
    type?: 'Facebook' | 'Google';
    userName?: string;
  },
) => {
  const response = await request(app)
    .post('/users/login/socialMedia')
    .send({
      email,
      id,
      profilePicture,
      type,
      userName,
    });
  return response;
};
