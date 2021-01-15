import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import http from 'http';
import socketIo from 'socket.io';

import userRouter from '@src/routes/user';

const initApp: () => http.Server = () => {
  const app: express.Application = express();
  const server = new http.Server(app);
  const io = new socketIo.Server(server);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true, limit: '5m' }));
  app.use(cookieParser());
  app.use(
    cors({
      origin: (_, cb: any) => cb(null, true),
      credentials: true,
      preflightContinue: true,
      exposedHeaders: [
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Origin, Origin, X-Requested-Width, Content-Type, Accept',
        'X-Password-Expired',
      ],
      optionsSuccessStatus: 200,
    }),
  );
  app.use('/users', userRouter(io));
  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });
  return server;
};

export default initApp;
