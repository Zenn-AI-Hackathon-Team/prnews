import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
} from "node:crypto";
import { HTTPException } from "hono/http-exception";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT;

if (!ENCRYPTION_KEY) {
	throw new HTTPException(500, {
		message:
			"ENCRYPTION_KEY is not defined in .env. Please set a 32-byte secret key.",
	});
}
if (!ENCRYPTION_SALT) {
	throw new HTTPException(500, {
		message:
			"ENCRYPTION_SALT is not defined in .env. Please set a salt string.",
	});
}

const key = scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, 32);

export function encrypt(text: string): string {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const encrypted = Buffer.concat([
		cipher.update(text, "utf8"),
		cipher.final(),
	]);
	return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(text: string): string {
	const [ivHex, encryptedTextHex] = text.split(":");
	if (!ivHex || !encryptedTextHex) {
		throw new HTTPException(400, { message: "Invalid encrypted text format" });
	}
	const iv = Buffer.from(ivHex, "hex");
	const encryptedText = Buffer.from(encryptedTextHex, "hex");
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	const decrypted = Buffer.concat([
		decipher.update(encryptedText),
		decipher.final(),
	]);
	return decrypted.toString();
}
