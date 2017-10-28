/* eslint no-console: [0] */
'use strict'

const Email = require('trailpack-proxy-email').Email

module.exports = class User extends Email {
  registered(user, data, options) {
    const User = this.app.orm['User']
    let resUser
    return User.resolve(user, options)
      .then(_user => {
        if (!_user) {
          throw new Error('User did not resolve')
        }
        resUser = _user

        const subject = data.subject || `Welcome ${ resUser.getSalutation() || 'User'}`
        const sendEmail = typeof data.send_email !== 'undefined' ? data.send_email : true

        return this.compose('registered', subject, resUser, sendEmail)
      })
  }
  /**
   *
   * @param user
   * @param data
   * @param options
   * @returns {Promise.<{type: string, subject: string, text: string, html:string, send_email:boolean}>}
   */
  recover(user, data, options) {
    const User = this.app.orm['User']
    let resUser
    return User.resolve(user, options)
      .then(_user => {
        if (!_user) {
          throw new Error('User did not resolve')
        }
        resUser = _user

        const subject = data.subject || `${ resUser.getSalutation() || 'User'} Recover Password`
        const sendEmail = typeof data.send_email !== 'undefined' ? data.send_email : true

        return this.compose('recover', subject, resUser, sendEmail)
      })
  }
}
