export interface AppConfig {
	port: number | string;
	environment: string;
}

export interface CsrfConfig {
	cookieName: string;
	secure: boolean;
	httpOnly: boolean;
}

export interface PathsConfig {
	static: string;
	views: string;
}

export interface Config {
	CONTACT_EMAIL: string | undefined;
	CONTACT_PHONE: string | undefined;
	DEPARTMENT_NAME: string | undefined;
	DEPARTMENT_URL: string | undefined;
	RATELIMIT_HEADERS_ENABLED: string | undefined;
	RATELIMIT_STORAGE_URI: string | undefined;
	RATE_LIMIT_MAX: number | string;
	RATE_WINDOW_MS: number;
	SECRET_KEY: string | undefined;
	SERVICE_NAME: string | undefined;
	SERVICE_PHASE: string | undefined;
	SERVICE_URL: string | undefined;
	app: AppConfig;
	csrf: CsrfConfig;
	paths: PathsConfig;
}