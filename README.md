# trailpack-proxy-passport

[![Greenkeeper badge](https://badges.greenkeeper.io/calistyle/trailpack-proxy-passport.svg)](https://greenkeeper.io/)
[![Gitter][gitter-image]][gitter-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![NPM version][npm-image]][npm-url]
[![NPM downloads][npm-download]][npm-url]
[![Build status][ci-image]][ci-url]
[![Dependency Status][daviddm-image]][daviddm-url]
[![Code Climate][codeclimate-image]][codeclimate-url]


## Passport built for security and love from [Cali Style Technologies](https://cali-style.com)
The Proxy Passport is built to be used on Trailsjs with Proxy Engine.

## Dependencies
### Supported ORMs
| Repo          |  Build Status (edge)                  |
|---------------|---------------------------------------|
| [trailpack-sequelize](https://github.com/trailsjs/trailpack-sequelize) | [![Build status][ci-sequelize-image]][ci-sequelize-url] |

### Supported Webserver
| Repo          |  Build Status (edge)                  |
|---------------|---------------------------------------|
| [trailpack-express](https://github.com/trailsjs/trailpack-express) | [![Build status][ci-express-image]][ci-express-url] |

## Intallation
With yo : 

```
npm install -g yo generator-trails
yo trails:trailpack trailpack-proxy-passport
```

With npm (you will have to create config file manually):
 
`npm install --save trailpack-proxy-passport`

## Configuration

First you need to add this trailpack to your __main__ configuration : 
```js
// config/main.js

module.exports = {
   ...

   packs: [
      ...
      require('trailpack-proxy-passport'),
      ...
   ]
   ...
}
```

You need to add `passportInit` and optionally `passportSession` : 
```js
// config/web.js
middlewares: {
  order: [
    'addMethods',
    'cookieParser',
    'session',
    'passportInit',
    'passportSession',
    'bodyParser',
    'methodOverride',
    'router',
    'www',
    '404',
    '500'
  ]
}
```
And to configure passport: 

```js
// config/passport.js
'use strict'

const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const EXPIRES_IN_SECONDS = 60 * 60 * 24
const SECRET = process.env.tokenSecret || 'mysupersecuretoken';
const ALGORITHM = 'HS256'
const ISSUER = 'localhost'
const AUDIENCE = 'localhost'

module.exports = {
  redirect: {
    login: '/',//Login successful
    logout: '/'//Logout successful
  },
  bcrypt: require('bcryptjs'), // custom bcrypt version if you prefer the native one instead of full js
  //Called when user is logged, before returning the json response
  onUserLogin: (req, app, user) => {
    return Promise.resolve(user)
  },
  onUserLogout: (req, app, user) => {
    return Promise.resolve(user)
  },
  //Optional: can be used to merge data from all third party profiles and the default user properties.
  mergeThirdPartyProfile: (user, profile) => {
    const mergedProfile = {
      email: user.email,
      gender: profile.gender
    }
    return Promise.resolve(mergedProfile)
  },
  strategies: {
    jwt: {
      strategy: JwtStrategy,
      tokenOptions: {
        expiresInSeconds: EXPIRES_IN_SECONDS,
        secret: SECRET,
        algorithm: ALGORITHM,
        issuer: ISSUER,
        audience: AUDIENCE
      },
      options: {
        secretOrKey: SECRET,
        issuer: ISSUER,
        audience: AUDIENCE,
        jwtFromRequest: ExtractJwt.fromAuthHeader()
      }
    },

    local: {
      strategy: require('passport-local').Strategy,
      options: {
        usernameField: 'username' // If you want to enable both username and email just remove this field
      }
    }

    /*
     twitter : {
     name     : 'Twitter',
     protocol : 'oauth',
     strategy : require('passport-twitter').Strategy,
     options  : {
     consumerKey    : 'your-consumer-key',
     consumerSecret : 'your-consumer-secret'
     }
     },

     facebook : {
     name     : 'Facebook',
     protocol : 'oauth2',
     strategy : require('passport-facebook').Strategy,
     options  : {
     clientID     : 'your-client-id',
     clientSecret : 'your-client-secret',
     scope        : ['email'] // email is necessary for login behavior
     }
     },

     google : {
     name     : 'Google',
     protocol : 'oauth2',
     strategy : require('passport-google-oauth').OAuth2Strategy,
     options  : {
     clientID     : 'your-client-id',
     clientSecret : 'your-client-secret'
     }
     }

     github: {
     strategy: require('passport-github').Strategy,
     name: 'Github',
     protocol: 'oauth2',
     options: {
     clientID     : 'your-client-id',
     clientSecret : 'your-client-secret',
     callbackURL:  'your-app-url' + '/auth/google/callback',
     scope:        [
      'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/plus.profile.emails.read'
     ]
     }
     }*/
  }
}
```

Then make sure to include the new file in **config/index.js**

```
//config/index.js
...
exports.passport = require('./passport')
```

### WARNING : be sure you configure sessions correctly if your strategies need them

Further documentation on passport-jwt config can be found at [themikenicholson/passport-jwt](https://github.com/themikenicholson/passport-jwt)

## Usage

### Policies 
Now you can apply some policies to control sessions under `config/policies.js` 
```
  ViewController: {
    helloWorld: [ 'Passport.sessionAuth' ]
  }
  or 
  ViewController: {
      helloWorld: [ 'Passport.jwt' ]
    }
```

### Routes prefix
By default auth routes doesn't have prefix, but if you use `trailpack-footprints` it automatically use footprints prefix to match your API. You can change this prefix by setting `config.proxyPassport.prefix`.

### Log/Register users with third party providers
You can register or log users with third party strategies by redirect the user to : 
```
http://localhost:3000/auth/{provider}
example github 
http://localhost:3000/auth/github
```

### Log/Register users with credentials
For adding a new user you can make a POST to `auth/local/register`  with at least this fields : `username` (or `email`) and `password`. 
For local authentication you have to POST credentials to `/auth/local` in order to log the user.

### Disconnect
If you want to disconnect a user from a provider you can call : 
```
http://localhost:3000/auth/{provider}/disconnect
example if a user don't want to connect with github anymore
http://localhost:3000/auth/github/disconnect
```

### Logout
Just make a GET to `auth/logout`

## License
[MIT](https://github.com/calistyle/trailpack-proxy-passport/blob/master/LICENSE)

[snyk-image]: https://snyk.io/test/github/calistyle/trailpack-proxy-passport/badge.svg
[snyk-url]: https://snyk.io/test/github/calistyle/trailpack-proxy-passport/
[npm-image]: https://img.shields.io/npm/v/trailpack-proxy-passport.svg?style=flat-square
[npm-url]: https://npmjs.org/package/trailpack-proxy-passport
[npm-download]: https://img.shields.io/npm/dt/trailpack-proxy-passport.svg
[ci-image]: https://img.shields.io/circleci/project/github/CaliStyle/trailpack-proxy-passport/master.svg
[ci-url]: https://circleci.com/gh/CaliStyle/trailpack-proxy-passport/tree/master
[daviddm-image]: http://img.shields.io/david/calistyle/trailpack-proxy-passport.svg?style=flat-square
[daviddm-url]: https://david-dm.org/calistyle/trailpack-proxy-passport
[codeclimate-image]: https://img.shields.io/codeclimate/github/calistyle/trailpack-proxy-passport.svg?style=flat-square
[codeclimate-url]: https://codeclimate.com/github/calistyle/trailpack-proxy-passport
[gitter-image]: http://img.shields.io/badge/+%20GITTER-JOIN%20CHAT%20%E2%86%92-1DCE73.svg?style=flat-square
[gitter-url]: https://gitter.im/trailsjs/trails

[ci-sequelize-image]: https://img.shields.io/travis/trailsjs/trailpack-sequelize/master.svg?style=flat-square
[ci-sequelize-url]: https://travis-ci.org/trailsjs/trailpack-sequelize

[ci-express-image]: https://img.shields.io/travis/trailsjs/trailpack-express/master.svg?style=flat-square
[ci-express-url]: https://travis-ci.org/trailsjs/trailpack-express
