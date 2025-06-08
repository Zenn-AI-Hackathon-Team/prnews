import { decrypt, encrypt } from "./crypto";

describe("crypto utils", () => {
	beforeAll(() => {
		process.env.ENCRYPTION_KEY = "test-encryption-key-32bytes-long-1234";
		process.env.ENCRYPTION_SALT = "test-salt-string";
	});

	const plain = "test-data";

	it("encrypt/decrypt 正常系", () => {
		const encrypted = encrypt(plain);
		const decrypted = decrypt(encrypted);
		expect(decrypted).toBe(plain);
	});

	it("decrypt 異常系: フォーマット不正", () => {
		expect(() => decrypt("invalid")).toThrow();
	});
});
