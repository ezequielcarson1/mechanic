export type EnvType = 'prod' | 'dev';

export interface EnvEndpoints {
    apiBaseUrl: string;
    wsUrl: string;
}

export interface BootstrapConfig {
    allowEnvSwitch: boolean;
    defaultEnv: EnvType;
    envs: {
        prod: EnvEndpoints;
        dev: EnvEndpoints;
        [key: string]: EnvEndpoints;
    };
}
