import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const SECRET = process.env.ENCRYPTION_SECRET || "default_buddyai_secret_32_bytes!!";

function getCipherKey(): Buffer {
  return crypto.createHash("sha256").update(SECRET).digest();
}

export interface EncryptedData {
  encryptedKey: string;
  iv: string;
  authTag: string;
}

/**
 * Encrypts an API key string using AES-256-GCM.
 */
export function encryptApiKey(plainText: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getCipherKey(), iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedKey: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted API key.
 */
export function decryptApiKey(encrypted: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getCipherKey(),
    Buffer.from(encrypted.iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(encrypted.authTag, "hex"));

  let decrypted = decipher.update(encrypted.encryptedKey, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks an API key for safe UI rendering (e.g. "sk-or-...9f4a").
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "••••••••";
  const start = key.slice(0, 5);
  const end = key.slice(-4);
  return `${start}••••••••${end}`;
}
