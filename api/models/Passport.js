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
      //More informations about supported models options here : http://docs.sequelizejs.com/en/latest/docs/models-definition/#configuration
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
          //If you need associations, put them here
          associate: (models) => {
            //More information about associations here : http://docs.sequelizejs.com/en/latest/docs/associations/
            models.Passport.belongsTo(models.User)
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
