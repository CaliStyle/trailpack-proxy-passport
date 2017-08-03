/* eslint new-cap: [0] */
'use strict'

const Model = require('trails/model')
const _ = require('lodash')
const queryDefaults = require('../utils/queryDefaults')
const helpers = require('proxy-engine-helpers')
const Errors = require('proxy-engine-errors')
/**
 * @module User
 * @description User model for basic auth
 */
module.exports = class User extends Model {

  static config(app, Sequelize) {
    return {
      //More informations about supported models options here : http://docs.sequelizejs.com/en/latest/docs/models-definition/#configuration
      options: {
        underscored: true,
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
            if (user instanceof User.Instance){
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
           * Get's user's passports if not on DAO
           * @param options
           */
          resolvePassports: function(options) {
            options = options || {}
            if (this.passports) {
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
