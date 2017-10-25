/* eslint no-console: [0] */
'use strict'

const Template = require('trailpack-proxy-email').Template

module.exports = class User extends Template {
  recover(user) {
    return `<h1>Password Recovery</h1>
<p>Dear ${user.getSalutation() || 'User'},</p>
<p>
  You are receiving this email because you or someone attempted to reset your password.  If it was you, follow the instructions below. Otherwise, please ignore this message.
</p>
<p>
  This is your recovery number: ${ user.recovery }
</p>
<p>Thank you!</p>`
  }
}
