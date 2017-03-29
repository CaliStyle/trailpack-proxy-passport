/* eslint no-console: [0] */
'use strict'

const Service = require('trails/service')
const jwt = require('jsonwebtoken')
const _ = require('lodash')

/**
 * @module PassportService
 * @description Main passport service
 */
module.exports = class PassportService extends Service {
  constructor(app) {
    super(app)
    this.protocols = require('./protocols')
    this.passport = require('passport')
  }

  /**
   * Create a token based on the passed user
   * @param user infos to serialize
   */
  createToken(user) {
    const config = this.app.config.proxyPassport.strategies.jwt
    return jwt.sign(
      {
        user: user.toJSON ? user.toJSON() : user
      },
      config.tokenOptions.secret,
      {
        algorithm: config.tokenOptions.algorithm,
        expiresIn: config.tokenOptions.expiresInSeconds,
        issuer: config.tokenOptions.issuer,
        audience: config.tokenOptions.audience
      }
    )
  }

  /**
   * Redirect to the right provider URL for login
   * @param req request object
   * @param res response object
   * @param provider to go to
   */
  endpoint(req, res, provider) {
    const strategies = this.app.config.proxyPassport.strategies, options = {}

    // If a provider doesn't exist for this endpoint, send the user back to the
    // login page
    if (!strategies.hasOwnProperty(provider)) {
      return Promise.reject(this.app.config.proxyPassport.redirect.login)
    }

    // Attach scope if it has been set in the config
    if (strategies[provider].hasOwnProperty('scope')) {
      options.scope = strategies[provider].scope
    }

    // Redirect the user to the provider for authentication. When complete,
    // the provider will redirect the user back to the application at
    //     /auth/:provider/callback
    this.passport.authenticate(provider, options)(req, res, req.next)
    return Promise.resolve()
  }

  /**
   * Provider callback to log or register the user
   * @param req request object
   * @param res response object
   * @param next callback
   */
  callback(req, res, next) {
    const provider = req.params.provider || 'local'
    const action = req.params.action

    if (provider === 'local') {
      if (action === 'register' && !req.user) {
        this.register(req, req.body)
          .then(user => next(null, user))
          .catch(next)
      }
      else if (action === 'connect' && req.user) {
        this.connect(req.user, req.body.password)
          .then(user => next(null, req.user))
          .catch(next)
      }
      else if (action === 'disconnect' && req.user) {
        this.disconnect(req, next)
      }
      else if (action === 'recover') {
        this.recover(req.user, req.body)
          .then(user => next(null, user))
          .catch(next)
      }
      else {
        let id = _.get(this.app, 'config.proxyPassport.strategies.local.options.usernameField')
        if (!id) {
          if (req.body['username']) {
            id = 'username'
          }
          else if (req.body['email']) {
            id = 'email'
          }
          else {
            const err = new Error('No username or email field')
            err.code = 'E_VALIDATION'
            return next(err)
          }
        }

        this.login(req, id, req.body.identifier || req.body[id], req.body.password)
          .then(user => next(null, user))
          .catch(next)
      }
    }
    else {
      if (action === 'disconnect' && req.user) {
        this.disconnect(req, next)
      }
      else {
        this.passport.authenticate(provider, next)(req, res, req.next)
      }
    }
  }

  /**
   * Register the user
   * @param userInfos
   * @returns {*}
   */
  register(req, userInfos) {
    const User = this.app.orm['User']
    const Passport = this.app.orm['Passport']

    const password = userInfos.password
    delete userInfos.password

    if (!password) {
      const err = new Error('E_VALIDATION')
      err.statusCode = 400
      return Promise.reject(err)
    }

    userInfos.passports = {
      protocol: 'local',
      password: password
    }

    return User.create(userInfos, {
      include: [
        {
          model: Passport,
          as: 'passports'
        }
      ]
    })
      .then(user => {
        const onUserLogin = _.get(this.app, 'config.proxyPassport.onUserLogin')
        if (typeof onUserLogin === 'object') {
          const promises = []
          Object.keys(onUserLogin).forEach(func => {
            promises.push(onUserLogin[func])
          })
          return Promise.all(promises.map(func => {
            return func(req, this.app, user)
          }))
            .then(userAttrs => {
              userAttrs.map(u => {
                user = _.extend(user.toJSON(), u)
              })
              return Promise.resolve(user)
            })
            .catch(err => {
              return Promise.reject(err)
            })
        }
        else if (typeof onUserLogin === 'function') {
          return Promise.resolve(onUserLogin(req, this.app, user))
        }
        else {
          return Promise.resolve(user)
        }
      })
  }

  /**
   * Update the local passport password of an user
   * @param user
   * @param password
   * @returns {Promise}
   */
  updateLocalPassword(user, password) {
    const User = this.app.orm['User']
    const Passport = this.app.orm['Passport']
    return User.findById(user.id, {
      include: [{
        model: Passport,
        as: 'passports',
        required: true
      }]
    })
      .then(user => {
        if (user) {
          // user = user[0]
          if (user.passports) {
            const localPassport = user.passports.find(passportObj => passportObj.protocol === 'local')
            if (localPassport) {
              localPassport.password = password
              return localPassport.save()
            }
            else {
              throw new Error('E_NO_AVAILABLE_LOCAL_PASSPORT')
            }
          }
          else {
            throw new Error('E_NO_AVAILABLE_PASSPORTS')
          }
        }
        else {
          throw new Error('E_USER_NOT_FOUND')
        }
      })
  }

  /**
   * Assign local Passport to user
   *
   * This function can be used to assign a local Passport to a user who doens't
   * have one already. This would be the case if the user registered using a
   * third-party service and therefore never set a password.
   *
   * @param {Object}   user
   * @param {Object}   password
   * @returns Promise to chain calls
   */
  connect(user, password) {
    const Passport = this.app.orm['Passport']
    const User = this.app.orm['User']

    return Passport.findOne({
      protocol: 'local',
      user: user.id
    })
      .then(passport => {
        if (!passport) {
          return Passport.create({
            protocol: 'local',
            password: password,
            user: user.id
          }, {
            include: [
              {
                model: User,
                required: true
              }
            ]
          })
        }
      })
  }

  /**
   * Disconnect a provider from the current user by removing the Passport object
   * @param req request object
   * @param next callback to call after
   */
  disconnect(req, next) {
    const Passport = this.app.orm['Passport']
    const user = req.user
    const provider = req.params.provider || 'local'
    const query = {}

    query.user = user.id
    query[provider === 'local' ? 'protocol' : 'provider'] = provider
    return Passport.findOne(query)
      .then(passport => {
        if (passport) {
          return passport.destroy()
          .then(passport => next(null, user))
        }
        else {
          throw new Error('E_USER_NO_PASSWORD')
        }
      })
      .catch(next)
  }

  /**
   * Log a user and check password
   * @param identifier of the user
   * @param password of the user
   * @returns {Promise} promise for next calls
   */
  login(req, fieldName, identifier, password) {
    const User = this.app.orm['User']
    const Passport = this.app.orm['Passport']
    const criteria = {}

    criteria[fieldName] = identifier

    return User.findOne({where: criteria,
      include: [{
        model: Passport,
        as: 'passports',
        required: true
      }]
    })
    // return this.app.services.FootprintService.find('User', criteria, {populate: 'passports'})
      .then(user => {
        if (!user) {
          throw new Error('E_USER_NOT_FOUND')
        }
        // user = user[0]

        const passport = user.passports.find(passportObj => passportObj.protocol === 'local')

        if (!passport) {
          throw new Error('E_USER_NO_PASSWORD')
        }

        const onUserLogin = _.get(this.app, 'config.proxyPassport.onUserLogin')

        return new Promise((resolve, reject) => {
          this.app.config.proxyPassport.bcrypt.compare(password, passport.password, (err, valid) => {
            if (err) {
              return reject(err)
            }
            if (valid) {
              if (typeof onUserLogin === 'object') {
                const promises = []
                Object.keys(onUserLogin).forEach(func => {
                  promises.push(onUserLogin[func])
                })

                Promise.all(promises.map(func => {
                  return func(req, this.app, user)
                }))
                  .then(userAttrs => {
                    userAttrs.map(u => {
                      user = _.extend(user.toJSON(), u)
                    })
                    return resolve(user)
                  })
                  .catch(err => {
                    return reject(err)
                  })
              }
              else if (typeof onUserLogin === 'function') {
                return resolve(Promise.resolve(onUserLogin(req, this.app, user)))
              }
              else {
                return resolve(user)
              }
            }
            else {
              return reject(new Error('E_WRONG_PASSWORD'))
            }
          })
        })
      })
  }
  logout(req, user) {
    const onUserLogout = _.get(this.app, 'config.proxyPassport.onUserLogout')
    if (typeof onUserLogout === 'object') {
      const promises = []
      Object.keys(onUserLogout).forEach(func => {
        promises.push(onUserLogout[func])
      })

      return Promise.all(promises.map(func => {
        return func(req, this.app, user)
      }))
        .then(userAttrs => {
          userAttrs.map(u => {
            user = _.extend(user.toJSON(), u)
          })
          return Promise.resolve(user)
        })
        .catch(err => {
          return Promise.reject(err)
        })
    }
    else {
      return Promise.resolve(onUserLogout(req, this.app))
    }
  }
  recover(user, profile) {
    user = user || {}

    return Promise.resolve(user)
    // // If the profile object contains a list of emails, grab the first one and
    // // add it to the user.
    // if (profile.hasOwnProperty('emails')) {
    //   user.email = profile.emails[0].value
    // }
    // // If the profile object contains a username, add it to the user.
    // if (profile.hasOwnProperty('username')) {
    //   user.username = profile.username
    // }
    //
    // // If neither an email or a username was available in the profile, we don't
    // // have a way of identifying the user in the future. Throw an error and let
    // // whoever's next in the line take care of it.
    // if (!user.username && !user.email) {
    //   return next(new Error('Neither a username nor email was available'))
    // }
  }
}