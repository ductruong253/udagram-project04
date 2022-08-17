/**
 * a key in JSON Web Key Set
 */
export interface Key {
    alg: string,
    kty: string,
    n: string,
    e: string,
    kid: string,
    x5t: string,
    x5c: Array<string>
}