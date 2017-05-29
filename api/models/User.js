'use strict'

const Model = require('trails/model')
const _ = require('lodash')
const queryDefaults = require('../utils/queryDefaults')
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
            options = _.merge(options, queryDefaults.User.default(app))
            return this.findById(criteria, options)
          }
        }
      }
    }
  }

  static schema(app, Sequelize) {
    return {
      username: {
        type: Sequelize.STRING,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      recovery: {
        type: Sequelize.STRING,
        allowNull: true
      }
    }
  }

}
