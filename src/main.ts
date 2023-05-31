import { createDriver } from '~neo4j/neo4j.util';

require('dotenv').config();
import { Liquid } from 'liquidjs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join, resolve } from 'path';
import * as session from 'express-session';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { readDirFiles } from './helpers/readDirFiles';
import { createRedisClient } from './app.providers';
import * as passport from 'passport';
import flash = require('connect-flash');
import { NestExpressApplication } from '@nestjs/platform-express';
import * as helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { defaultNeo4JConfig } from '~root/neo4j/neo4j.module';
import { Neo4jService } from '~root/neo4j/neo4j.service';
import * as process from "process";
const RedisStore = require('connect-redis')(session);
const viewsDir = resolve(join(__dirname, '../../', 'views'));
const publicDir = resolve(join(__dirname, '../../', 'public'));
const uploadDir = resolve(join(__dirname, '../../', 'upload'));
declare const module: any;
const companion = require('@uppy/companion');
const { app: companionApp } = companion.app({
  s3: {
    // This is the crucial part; set an endpoint template for the service you want to use.
    endpoint: 'https://{region}.digitaloceanspaces.com',
    getKey: (req, filename) => `${crypto.randomUUID()}-${filename}`,

    key: process.env.COMPANION_AWS_KEY,
    secret: process.env.COMPANION_AWS_SECRET,
    bucket: process.env.COMPANION_AWS_BUCKET,
    region: process.env.COMPANION_AWS_REGION,
  },
  server: {
    host: process.env.UPPY_SERVER,
    path: '/companion',
  },
  filePath: uploadDir,
  secret: 'blah blah',
  debug: true,
});
export let ViewEngine = new Liquid({
  cache: process.env.NODE_ENV === 'production',
  root: viewsDir,
});
export let app: NestExpressApplication;

(async () => {
  const files = await readDirFiles(resolve(__dirname, 'liquidjs'), ['.js']);
  files.forEach((file) => {
    ViewEngine.plugin(require(file.fullFileName));
  });
})();

async function bootstrap() {
  app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
    cors: {
      credentials: true,
      origin: true,
      exposedHeaders: ['x-sess-id', 'set-cookie'],
      methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    },
  });

  const tokenExpiry = process.env.OAUTH_TOKEN_EXPIRY ? parseInt(process.env.OAUTH_TOKEN_EXPIRY) : 60 * 60 * 23;

  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false }));
  app.use(compression());
  app.use(
    session({
      store: new RedisStore({ client: createRedisClient(), ttl: tokenExpiry }),
      saveUninitialized: false,
      secret: 'keyboard cat',
      cookie: {
        secure: false,
        path: '/',
        maxAge: null, //Needs to be in milliseconds
        httpOnly: false,
      },
      name: 'app.sess.id',
      resave: false,
    }),
  );
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,UPDATE,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Set-Cookie',
    );
    res.header('x-sess-id', req.session.id);
    next();
  });
  app.enable('trust proxy');
  app.useStaticAssets(publicDir);
  app.setBaseViewsDir(viewsDir);
  app.engine('liquid', ViewEngine.express());
  app.setViewEngine('liquid');
  app.useGlobalPipes(
    new ValidationPipe({
      forbidUnknownValues: false,
    }),
  );
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use('/companion', companionApp)

  const server = await app.listen(process.env.PORT || 3000);
  companion.socket(server);
  console.log(`App is running on port ${process.env.PORT}`);
}

createDriver(defaultNeo4JConfig).then(async (driver) => {
  Neo4jService.driverInstance = driver;
  await bootstrap();
});
