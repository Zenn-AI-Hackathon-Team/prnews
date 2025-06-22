export type HealthStatus = {
    ok: boolean;
};
export declare const createGeneralService: (deps: {}) => {
    checkHealth: () => Promise<HealthStatus>;
};
export type GeneralService = ReturnType<typeof createGeneralService>;
