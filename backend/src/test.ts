import Axios from 'axios';
import { verify, decode } from 'jsonwebtoken';
import { Jwt } from './auth/Jwt';

(async () => {
    //step 1: decode JWT to get KID:
    const token = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IndKbk83SEpVVW00WVlXSV9sV0FuZSJ9.eyJpc3MiOiJodHRwczovL2Rldi12MWwwd250Yi51cy5hdXRoMC5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDI3NzUzMTI3OTUxNDQwMDk1NzMiLCJhdWQiOiJzeFMwMndKTFdFMEdWYWhGOGNSVzZkVDBkeHdhUDVMQiIsImlhdCI6MTY2MDU3MTA3OCwiZXhwIjoxNjYwNjA3MDc4LCJhdF9oYXNoIjoiXzRzVHNWT284VnQ2RnNXU0pqMXVnUSIsIm5vbmNlIjoiZF9rNDJhblhHcH5uR0g4bmp5WlItdU5nbkF1bVZMUEMifQ.nmLWbJsexFC__DUG0Mg2ZuQbsjX2O8QvRoFqpfCjjXuekAB_ayX0El-mq9sn68R4RentWM7f_2hpao_D0GqEjSru-fkIX_v7-MnyjOQb1PYgSa9BH6VJW8pud1NSIgLdhdqxSOJICPxpuX-s-2Q1wkTTMBMmtmL1PS07YWN6PXkvXw617FBYdTkHFG_RW3WK3oZ98M-eXPLq21qPKad-41A0SoLwix4qG6LuocExiYpp9IfQ1TQVvIvApAqHV5WHDITi1MjVwkHb7UV5F8y23aaVpKXMEvwh2uRXT9mZw4UsJKsQE_Qm1IuJvVDevqisXCzRg-5cVx5q_wIPE-Uxew';
    const jwt: Jwt = decode(token, { complete: true }) as Jwt;
    const requestKID = jwt.header.kid;
    //step 2: call to get certificate and return the correct key
    const jwksUrl = 'https://dev-v1l0wntb.us.auth0.com/.well-known/jwks.json';
    const jwks = await Axios.get(jwksUrl);
    const keyset = jwks.data.keys;
    const matchedKey = keyset.filter(key => key.kid === requestKID);
    // console.log(matchedKey);
    //step 2: build PEM content from matched key
    const PEM = toPEMFormat(matchedKey[0].x5c[0])
    // console.log(PEM)
    //step 3: verify the token

    const verifyResult = verify(token, PEM, { algorithms: ['RS256'] })
    console.log(verifyResult);
})()

const toPEMFormat = (x509CertChain) => {
    return `-----BEGIN CERTIFICATE-----\n${x509CertChain.match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----\n`
}
