declare namespace NodeJS {
  export interface ProcessEnv {
    PORT: string;
    SESSION_SECRET: string;
    REDIS_URL: string;
  }
}