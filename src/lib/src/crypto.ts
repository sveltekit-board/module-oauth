import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function cipher(data:string, key: string) {
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = randomBytes(12); 
    
    const encrypt = createCipheriv('aes-256-gcm', keyBuffer as any, iv as any);
    
    let encrypted = encrypt.update(data, 'utf-8', 'base64url');
    encrypted += encrypt.final('base64url');
    
    const authTag = encrypt.getAuthTag().toString('base64url');
    const ivBase64 = iv.toString('base64url');
    
    return `${ivBase64}.${authTag}.${encrypted}`;
}

function decipher(encryptedData: string, key: string) {    
    const [ivBase64, authTagBase64, encrypted] = encryptedData.split('.');
    if (!ivBase64 || !authTagBase64 || !encrypted) {
        throw new Error("Invalid encrypted data.");
    }
    
    const keyBuffer = Buffer.from(key, 'hex');
    const iv = Buffer.from(ivBase64, 'base64url');
    const authTag = Buffer.from(authTagBase64, 'base64url');
    
    const decrypt = createDecipheriv('aes-256-gcm', keyBuffer as any, iv as any);
    
    decrypt.setAuthTag(Uint8Array.from(authTag));
    
    let decrypted = decrypt.update(encrypted, 'base64url', 'utf-8');
    decrypted += decrypt.final('utf-8');
    
    return decrypted;
}

export { cipher, decipher };