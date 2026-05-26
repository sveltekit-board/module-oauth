import { cipher, decipher } from '$lib/src/crypto.js'

export async function load() {
    const key = '2f19a8951789e683bee75095332acd7fcdf1add960b232208dec981414d696ca';

    const string = 'abcde';
    const ciphered = cipher(string, key);
    const deciphered = decipher(ciphered, '2f19a8951789e683bee75095332acd7fcdf1add960b232208dec981414d696ca');

    console.log(ciphered, deciphered);
}