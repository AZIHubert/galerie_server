import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import userRouter from '@src/routes/user';

const initApp: () => express.Application = () => {
  const app: express.Application = express();
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
  app.use('/users', userRouter);
  return app;
};

export default initApp;
