'use strict'
const Trailpack = require('trailpack')
const lib = require('./lib')
const _ = require('lodash')

module.exports = class ProxyPassportTrailpack extends Trailpack {

  /**
   * Check express4 is used and verify session configuration
   */
  validate() {
    if (!_.includes(_.keys(this.app.packs), 'express')) {
      return Promise.reject(new Error('This Trailpack currently only works with express!'))
    }

    if (!_.includes(_.keys(this.app.packs), 'proxy-sequelize')) {
      return Promise.reject(new Error('This Trailpack currently only works with trailpack-proxy-sequelize!'))
    }

    if (!this.app.config.proxyPassport) {
      return Promise.reject(new Error('No configuration found at config.proxyPassport!'))
    }

    const strategies = this.app.config.proxyPassport.strategies
    if (!strategies || (strategies && Object.keys(strategies).length === 0)) {
      return Promise.reject(new Error('No strategies found at config.proxyPassport.strategies!'))
    }

    if (strategies.jwt && _.get(this.app, 'config.proxyPassport.jwt.tokenOptions.secret') === 'mysupersecuretoken') {
      return Promise.reject(new Error('You need to change the default token!'))
    }

    return Promise.all([
      lib.Validator.validatePassportsConfig(this.app.config.proxyPassport)
    ])
  }

  /**
   * Initialise passport functions and load strategies
   */
  configure() {
    lib.ProxyPassport.init(this.app)
    lib.ProxyPassport.loadStrategies(this.app)
    lib.ProxyPassport.copyDefaults(this.app)
    lib.ProxyPassport.addRoutes(this.app)
  }

  constructor(app) {
    super(app, {
      config: require('./config'),
      api: require('./api'),
      pkg: require('./package')
    })
  }
}

