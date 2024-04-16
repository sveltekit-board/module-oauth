import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function cipher(data: string, key: string): string {
    const bufferKey = Buffer.from(key, 'hex');
    const encrypt = createCipheriv('aes-256-gcm', bufferKey, bufferKey);
    const encrypted = encrypt.update(data, 'utf-8', 'hex');

    return encrypted;
}

function decipher(encrypted: string, key: string): string {
    const bufferKey = Buffer.from(key, 'hex');
    const decrypt = createDecipheriv('aes-256-gcm', bufferKey, bufferKey);
    const decrypted = decrypt.update(encrypted, 'hex', 'utf-8');

    return decrypted;
}

export {cipher, decipher}