"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adminjs_1 = __importDefault(require("adminjs"));
const AdminJSPrisma = __importStar(require("@adminjs/prisma"));
const express_1 = __importDefault(require("@adminjs/express"));
const express_2 = __importDefault(require("express"));
const db_1 = require("./db");
const session = require("express-session");
const connectRedis = require("connect-redis");
const redis = require("redis");
const RedisStore = connectRedis(session);
const redisClient = redis.createClient(process.env.REDIS_URL || "redis://localhost:6379");
const PORT = process.env.PORT || 3000;
adminjs_1.default.registerAdapter({
    Resource: AdminJSPrisma.Resource,
    Database: AdminJSPrisma.Database,
});
const authenticate = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const admin = yield db_1.prisma.user.findUnique({
        where: { email },
    });
    if (admin && admin.password === password && admin.role === "admin") {
        return admin;
    }
    return null;
});
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_2.default)();
    const dmmf = db_1.prisma._baseDmmf;
    const adminOptions = {
        resources: [
            {
                resource: { model: dmmf.modelMap.User, client: db_1.prisma },
                options: {},
            },
            {
                resource: { model: dmmf.modelMap.Project, client: db_1.prisma },
                options: {},
            },
            {
                resource: { model: dmmf.modelMap.Apikey, client: db_1.prisma },
                options: {},
            },
        ],
    };
    const admin = new adminjs_1.default(adminOptions);
    const adminRouter = express_1.default.buildAuthenticatedRouter(admin, {
        authenticate,
        cookieName: "adminjs",
        cookiePassword: process.env.COOKIE_PASSWORD || 'cookiepassword',
    }, null, {
        store: new RedisStore({ client: redisClient }),
        secret: process.env.SESSION_SECRET || 'secret',
        resave: false,
        saveUninitialized: true,
        cookie: {
            httpOnly: process.env.NODE_ENV === "production",
            secure: process.env.NODE_ENV === "production",
        },
        name: "adminjs",
    });
    app.use(admin.options.rootPath, adminRouter),
        app.listen(PORT, () => {
            console.log(`AdminJS started on localhost:${PORT}${admin.options.rootPath}`);
        });
});
start();
//# sourceMappingURL=index.js.map