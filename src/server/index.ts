import bodyParser from 'body-parser';
import connectSessionSequelize from 'connect-session-sequelize';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import http from 'http';
import Sequelize from 'sequelize';
import socketIo from 'socket.io';
import cookieParser from 'cookie-parser';

import userRouter from '@src/routes/user';
import passport from '@src/helpers/passport';
import initSequelize from '@src/helpers/initSequelize.js';

const SequelizeStore = connectSessionSequelize(session.Store);

const sequelize = initSequelize();

sequelize.define('Sessions', {
  sid: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  expires: Sequelize.DATE,
  data: Sequelize.TEXT,
});

const sequelizeStore = new SequelizeStore({
  db: sequelize,
  table: 'Sessions',
  tableName: 'Sessions',
});

const initApp: () => http.Server = () => {
  const app: express.Application = express();
  const server = new http.Server(app);
  const io = new socketIo.Server(server);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true, limit: '5m' }));
  app.use(cookieParser());
  app.use(session({
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: false,
    },
    resave: true,
    saveUninitialized: true,
    secret: 'keyboard cat',
    store: sequelizeStore,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(
    cors({
      origin: '*',
    }),
  );
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  app.use('/users', userRouter(io));
  io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
  });
  return server;
};

export default initApp;
