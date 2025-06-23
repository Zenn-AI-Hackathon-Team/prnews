export type HealthStatus = {
	ok: boolean;
	// 将来的にDB接続状況などを追加するならここに追記
	// database?: 'connected' | 'disconnected';
};

// biome-ignore lint/complexity/noBannedTypes: <explanation>
export const createGeneralService = (deps: {}) => {
	const checkHealth = async (): Promise<HealthStatus> => {
		return { ok: true };
	};

	return {
		checkHealth,
	};
};

export type GeneralService = ReturnType<typeof createGeneralService>;
