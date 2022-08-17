import { APIGatewayTokenAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'
import { Key } from '../../auth/Key'
import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-v1l0wntb.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    if (!jwtToken) throw new Error('Token expired or invalid')
    logger.info('User was authorized')
    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized: ', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

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
