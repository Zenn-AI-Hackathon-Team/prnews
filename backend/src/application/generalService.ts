export type HealthStatus = {
	ok: boolean;
	// 将来的にDB接続状況などを追加するならここに追記
	// database?: 'connected' | 'disconnected';
};

// biome-ignore lint/complexity/noBannedTypes: 依存オブジェクトがないため {} で定義
export const createGeneralService = (deps: {}) => {
	const checkHealth = async (): Promise<HealthStatus> => {
		// 今は単純に成功を返す
		// 将来的には、DB接続確認などのチェック処理をここに追加できる
		return { ok: true };
	};

	return {
		checkHealth,
	};
};

export type GeneralService = ReturnType<typeof createGeneralService>;
