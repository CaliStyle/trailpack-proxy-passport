'use strict'

module.exports = {
  redirect: {
    //Login successful
    login: '/',
    //Logout successful
    logout: '/',
    //Recover successful
    recover: '/'
  },
  bcrypt: require('bcryptjs'),
  // onUserLogin: (req, app, user) => {
  //   user = user.toJSON()
  //   if (user.passports) {
  //     delete user.passports
  //   }
  //   return Promise.resolve(user)
  // },
  mergeThirdPartyProfile: (user, profile) => {
    return Promise.resolve(user)
  },
  emails: {},
  events: {}
}
