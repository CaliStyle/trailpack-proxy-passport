/* eslint new-cap: [0] */
'use strict'

const Model = require('trails/model')
const hashPassword = require('./hashPassword')
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
          beforeCreate: (values, options, fn) => {
            hashPassword(app.config.proxyPassport.bcrypt, values, fn)
          },
          beforeUpdate: (values, options, fn) => {
            options.validate = false // skip re-validation of password hash
            hashPassword(app.config.proxyPassport.bcrypt, values, fn)
          }
        },
        classMethods: {
          associate: (models) => {
            models.Passport.belongsTo(models.User, {
              //
            })
          }
        },
        instanceMethods: {
          resolveUser: function(options) {
            options = options || {}
            if (this.User && this.User instanceof app.orm['User'].Instance) {
              return Promise.resolve(this)
            }
            else {
              return this.getUser({transaction: options.transaction || null})
                .then(user => {
                  user = user || null
                  this.User = user
                  this.setDataValue('User', user)
                  this.set('User', user)
                })
            }
          }
        }
      }
    }
  }

  static schema(app, Sequelize) {
    return {
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
