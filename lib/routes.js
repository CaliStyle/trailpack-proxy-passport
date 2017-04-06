module.exports = [
  {
    method: ['POST'],
    path: '/auth/local',
    handler: 'AuthController.callback'
  },
  {
    method: ['POST'],
    path: '/auth/local/{action}',
    handler: 'AuthController.callback'
  },
  {
    method: ['GET'],
    path: '/auth/{provider}/callback',
    handler: 'AuthController.callback'
  }, {
    method: ['GET'],
    path: '/auth/{provider}/callback',
    handler: 'AuthController.callback'
  }, {
    method: ['GET'],
    path: '/auth/{provider}/{action}',
    handler: 'AuthController.callback'
  },
  {
    method: ['GET'],
    path: '/auth/{provider}',
    handler: 'AuthController.provider'
  },
  {
    method: ['POST'],
    path: '/auth/recover',
    handler: 'AuthController.recover'
  },
  {
    method: ['GET','POST'],
    path: '/auth/logout',
    handler: 'AuthController.logout'
  }
]
