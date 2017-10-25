/* eslint new-cap: [0] */
/* eslint no-console: [0] */
'use strict'

const Model = require('trails/model')
const _ = require('lodash')
const queryDefaults = require('../utils/queryDefaults')
const helpers = require('proxy-engine-helpers')
const Errors = require('proxy-engine-errors')
const shortId = require('shortid')

/**
 * @module User
 * @description User model for basic auth
 */
module.exports = class User extends Model {

  static config(app, Sequelize) {
    return {
      //More information about supported models options here : http://docs.sequelizejs.com/en/latest/docs/models-definition/#configuration
      options: {
        underscored: true,
        hooks: {
          beforeCreate: (values, options) => {
            // If not token was already created, create it
            if (!values.token) {
              values.token = `user_${shortId.generate()}`
            }
          }
        },
        classMethods: {
          //If you need associations, put them here
          associate: (models) => {
            //More information about associations here : http://docs.sequelizejs.com/en/latest/docs/associations/
            models.User.hasMany(models.Passport, {
              as: 'passports',
              onDelete: 'CASCADE',
              foreignKey: {
                allowNull: false
              }
            })
          },
          findByIdDefault: function(criteria, options) {
            if (!options) {
              options = {}
            }
            options = _.defaultsDeep(options, queryDefaults.User.default(app))
            return this.findById(criteria, options)
          },
          findOneDefault: function(options) {
            if (!options) {
              options = {}
            }
            options = _.defaultsDeep(options, queryDefaults.User.default(app))
            return this.findOne(options)
          },
          resolve: function(user, options){
            options = options || {}
            const User = this
            if (user instanceof User){
              return Promise.resolve(user)
            }
            else if (user && _.isObject(user) && user.id) {
              return User.findById(user.id, options)
                .then(resUser => {
                  if (!resUser) {
                    throw new Errors.FoundError(Error(`User ${user.id} not found`))
                  }
                  return resUser
                })
            }
            else if (user && _.isObject(user) && user.email) {
              return User.findOne(_.defaultsDeep({
                where: {
                  email: user.email
                }
              }, options))
                .then(resUser => {
                  if (!resUser) {
                    throw new Errors.FoundError(Error(`User ${user.email} not found`))
                  }
                  return resUser
                })
            }
            else if (user && _.isNumber(user)) {
              return User.findById(user, options)
                .then(resUser => {
                  if (!resUser) {
                    throw new Errors.FoundError(Error(`User ${user} not found`))
                  }
                  return resUser
                })
            }
            else if (user && _.isString(user)) {
              return User.findOne(_.defaultsDeep({
                where: {
                  email: user
                }
              }, options))
                .then(resUser => {
                  if (!resUser) {
                    throw new Errors.FoundError(Error(`User ${user} not found`))
                  }
                  return resUser
                })
            }
            else {
              throw new Errors.FoundError(Error(`User ${user} not found`))
            }
          }
        },
        instanceMethods: {
          /**
           *
           * @param options
           * @returns {string}
           */
          getSalutation: function(options) {
            options = options || {}

            let salutation = 'Customer'

            if (this.username) {
              salutation = this.username
            }
            else if (this.email) {
              salutation = this.email
            }
            else {
              salutation = this.id
            }
            return salutation
          },
          /**
           *
           * @param val
           * @returns {Promise.<TResult>}
           */
          generateRecovery: function(val) {
            return app.config.proxyPassport.bcrypt.hash(
              val,
              app.config.proxyPassport.bcrypt.genSaltSync(10)
            )
              .then(hash => {
                this.recovery = hash
                return this
              })
          },
          /**
           * Get's user's passports if not on DAO
           * @param options
           */
          resolvePassports: function(options) {
            options = options || {}
            if (
              this.passports
              && this.passports.every(t => t instanceof app.orm['Passport'])
              && options.reload !== true
            ) {
              return Promise.resolve(this)
            }
            else {
              return this.getPassports({transaction: options.transaction || null})
                .then(passports => {
                  passports = passports || []
                  this.passports = passports
                  this.setDataValue('passports', passports)
                  this.set('passports', passports)
                  return this
                })
            }
          }
        }
      }
    }
  }

  static schema(app, Sequelize) {
    return {
      token: {
        type: Sequelize.STRING,
        unique: true
      },
      // Username
      username: {
        type: Sequelize.STRING,
        unique: true
      },
      // Unique Email address for user
      email: {
        type: Sequelize.STRING,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      // Recovery string in the event of a password reset
      recovery: {
        type: Sequelize.STRING,
        allowNull: true
      },
      // An object of user preferences
      preferences: helpers.JSONB('User', app, Sequelize, 'preferences', {
        defaultValue: {}
      })
    }
  }

}
