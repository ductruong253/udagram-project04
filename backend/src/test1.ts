import Axios from 'axios'
import { verify, decode } from 'jsonwebtoken'
import { Jwt } from './auth/Jwt'
import { JwtPayload } from './auth/JwtPayload'
import { Key } from './auth/Key'
import { createLogger } from './utils/logger'

const logger = createLogger('auth')

const authHeader =
    'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndKbk83SEpVVW00WVlXSV9sV0FuZSJ9.eyJpc3MiOiJodHRwczovL2Rldi12MWwwd250Yi51cy5hdXRoMC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDI3NzUzMTI3OTUxNDQwMDk1NzMiLCJhdWQiOiJzeFMwMndKTFdFMEdWYWhGOGNSVzZkVDBkeHdhUDVMQiIsImlhdCI6MTY2MDU3MTA3OCwiZXhwIjoxNjYwNjA3MDc4LCJhdF9oYXNoIjoiXzRzVHNWT284VnQ2RnNXU0pqMXVnUSIsIm5vbmNlIjoiZF9rNDJhblhHcH5uR0g4bmp5WlItdU5nbkF1bVZMUEMifQ.nmLWbJsexFC__DUG0Mg2ZuQbsjX2O8QvRoFqpfCjjXuekAB_ayX0El-mq9sn68R4RentWM7f_2hpao_D0GqEjSru-fkIX_v7-MnyjOQb1PYgSa9BH6VJW8pud1NSIgLdhdqxSOJICPxpuX-s-2Q1wkTTMBMmtmL1PS07YWN6PXkvXw617FBYdTkHFG_RW3WK3oZ98M-eXPLq21qPKad-41A0SoLwix4qG6LuocExiYpp9IfQ1TQVvIvApAqHV5WHDITi1MjVwkHb7UV5F8y23aaVpKXMEvwh2uRXT9mZw4UsJKsQE_Qm1IuJvVDevqisXCzRg-5cVx5q_wIPE-Uxew';
(async () => {
    const result = await verifyToken(authHeader);
    console.log(result);
})()
async function verifyToken(authHeader: string): Promise<JwtPayload> {
    try {
        // TODO: Implement token verification
        // You should implement it similarly to how it was implemented for the exercise for the lesson 5
        // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

        //step 1: decode JWT to get request KID:
        const token = getToken(authHeader)
        const jwt: Jwt = decode(token, { complete: true }) as Jwt
        const requestKID: string = jwt?.header?.kid as string
        //step 2: call to get certificate and return the matched key
        const jwksUrl = 'https://dev-v1l0wntb.us.auth0.com/.well-known/jwks.json'
        const jwks = await Axios.get(jwksUrl)
        const keyset: Array<Key> = jwks.data.keys
        const matchedKey = keyset.filter((key) => key.kid === requestKID)
        if (!matchedKey || !matchedKey.length)
            throw new Error('No matched key found')
        //step 3: build PEM content from 1st matched key
        const PEM: string = buildPEMFromCert(matchedKey[0].x5c[0])
        //step 3: verify the token
        return verify(token, PEM, { algorithms: ['RS256'] }) as JwtPayload;
        // console.log(verifyResult)
    } catch (err) {
        logger.error('Authorizer error: ', err)
    }
}

function getToken(authHeader: string): string {
    if (!authHeader) throw new Error('No authentication header')

    if (!authHeader.toLowerCase().startsWith('bearer '))
        throw new Error('Invalid authentication header')

    const split = authHeader.split(' ')
    const token = split[1]

    return token
}

const buildPEMFromCert = (x509CertChain: string) => {
    return `-----BEGIN CERTIFICATE-----\n${x509CertChain
        .match(/.{1,64}/g)
        .join('\n')}\n-----END CERTIFICATE-----\n`
}
