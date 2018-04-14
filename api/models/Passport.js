/* eslint new-cap: [0] */
/* eslint no-console: [0] */

'use strict'

const Model = require('trails/model')
// const hashPassword = require('../../lib').ProxyPassport.hashPassword
/**
 * @module Passport
 * @description Passport model
 */
module.exports = class Passport extends Model {

  static config(app, Sequelize) {
    return {
      options: {
        underscored: true,
        hooks: {
          beforeCreate: (values, options) => {
            // return hashPassword(app.config.proxyPassport.bcrypt, values)
            // values.hashPassword(options)
            return values.generateHash(values.password)
              .catch(err => {
                return Promise.reject(err)
              })
          },
          beforeUpdate: (values, options) => {
            // return hashPassword(app.config.proxyPassport.bcrypt, values)
            // values.hashPassword(options)
            return values.generateHash(values.password)
              .catch(err => {
                return Promise.reject(err)
              })
          },
          // beforeUpdate: (values, options) => {
          //   options.validate = false // skip re-validation of password hash
          //   values.hashPassword(options)
          // }
        },
        classMethods: {
          associate: (models) => {
            models.Passport.belongsTo(models.User, {
              //
              foreignKey: 'user_id'
            })
          }
        },
        instanceMethods: {
          /**
           *
           * @param password
           * @returns {Promise.<TResult>}
           */
          generateHash: function(password) {
            if (!password) {
              return Promise.resolve(this)
            }
            return app.config.proxyPassport.bcrypt.hash(
              password,
              app.config.proxyPassport.bcrypt.genSaltSync(10)
            )
              .then(hash => {
                this.password = hash
                return this
              })
          },
          /**
           *
           * @param password
           * @returns {Promise}
           */
          validatePassword: function(password) {
            return app.config.proxyPassport.bcrypt.compare(password, this.password)
          },
          /**
           *
           * @param options
           * @returns {*}
           */
          resolveUser: function(options) {
            options = options || {}
            if (
              this.User
              && this.User instanceof app.orm['User']
              && options.reload !== true
            ) {
              return Promise.resolve(this)
            }
            else {
              return this.getUser({transaction: options.transaction || null})
                .then(_user => {
                  _user = _user || null
                  this.User = _user
                  this.setDataValue('User', _user)
                  this.set('User', _user)
                })
            }
          }
        }
      }
    }
  }

  static schema(app, Sequelize) {
    return {
      user_id: {
        type: Sequelize.INTEGER
      },
      protocol: {
        type: Sequelize.STRING,
        validate: {
          isAlphanumeric: true
        },
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [8, undefined],
            msg: 'Password must be long at least 8 characters'
          }
        }
      },

      provider: {
        type: Sequelize.STRING,
        allowNull: true
      },
      identifier: {
        type: Sequelize.STRING,
        allowNull: true
      },
      tokens: {
        type: Sequelize.STRING,
        allowNull: true
      }
    }
  }

}
