// Configuration type definitions

export interface AppConfig {
  port: number;
  environment: string;
  appName: string;
  useHttps: boolean;
}

export interface CsrfConfig {
  cookieName: string;
  secure: boolean;
  httpOnly: boolean;
}

export interface SessionConfig {
  secret: string;
  name: string;
  resave: boolean;
  saveUninitialized: boolean;
  encryptionKey: string;
}

export interface PathsConfig {
  static: string;
  views: string;
}

export interface ApiConfig {
  baseUrl: string;
  auth: {
    clientId: string;
    clientSecret: string;
  };
}

export interface Config {
  CONTACT_EMAIL: string | undefined;
  DEPARTMENT_NAME: string | undefined;
  DEPARTMENT_URL: string | undefined;
  RATELIMIT_HEADERS_ENABLED: string | undefined;
  RATE_LIMIT_MAX: number | string;
  RATE_WINDOW_MS: number;
  SERVICE_NAME: string | undefined;
  SERVICE_PHASE: string | undefined;
  SERVICE_URL: string | undefined;
  app: AppConfig;
  csrf: CsrfConfig;
  session: SessionConfig;
  paths: PathsConfig;
  api: ApiConfig;
}