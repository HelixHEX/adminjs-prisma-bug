import AdminJS from "adminjs";
import * as AdminJSPrisma from "@adminjs/prisma";
import AdminJSExpress from "@adminjs/express";
import express from "express";
import { prisma } from "./db";
import { DMMFClass } from "@prisma/client/runtime";


const session = require("express-session");
const connectRedis = require("connect-redis");
const redis = require("redis");

const RedisStore = connectRedis(session);
const redisClient = redis.createClient(process.env.REDIS_URL || "redis://localhost:6379");

const PORT = process.env.PORT || 3000;

AdminJS.registerAdapter({
  Resource: AdminJSPrisma.Resource,
  Database: AdminJSPrisma.Database,
});

const authenticate = async (email: string, password: string) => {
  const admin = await prisma.user.findUnique({
    where: { email },
  });
  if (admin && admin.password === password && admin.role === "admin") {
    return admin;
  }
  return null;
};

const start = async () => {
  const app = express();

  const dmmf = (prisma as any)._baseDmmf as DMMFClass;
  const adminOptions = {
    resources: [
      {
        resource: { model: dmmf.modelMap.User, client: prisma },
        options: {},
      },
      {
        resource: { model: dmmf.modelMap.Project, client: prisma },
        options: {},
      },
      {
        resource: { model: dmmf.modelMap.Apikey, client: prisma },
        options: {},
      },
    ],
  };
  const admin = new AdminJS(adminOptions);
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: "adminjs",
      cookiePassword: process.env.COOKIE_PASSWORD || 'cookiepassword',
    },
    null,
    {
      store: new RedisStore({ client: redisClient }),
      secret: process.env.SESSION_SECRET || 'secret',
      resave: false,
      saveUninitialized: true,
      cookie: {
        httpOnly: process.env.NODE_ENV === "production",
        secure: process.env.NODE_ENV === "production",
      },
      name: "adminjs",
    }
  );

  app.use(admin.options.rootPath, adminRouter),
    app.listen(PORT, () => {
      console.log(
        `AdminJS started on localhost:${PORT}${admin.options.rootPath}`
      );
    });
};

start()