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
    handler: 'AuthController.callback',
    config: {
      app: {
        proxyRouter: {
          ignore: true
        }
      }
    }
  }, {
    method: ['GET'],
    path: '/auth/{provider}/callback',
    handler: 'AuthController.callback',
    config: {
      app: {
        proxyRouter: {
          ignore: true
        }
      }
    }
  }, {
    method: ['GET'],
    path: '/auth/{provider}/{action}',
    handler: 'AuthController.callback',
    config: {
      app: {
        proxyRouter: {
          ignore: true
        }
      }
    }
  },
  {
    method: ['GET'],
    path: '/auth/{provider}',
    handler: 'AuthController.provider',
    config: {
      app: {
        proxyRouter: {
          ignore: true
        }
      }
    }
  },
  {
    method: ['POST'],
    path: '/auth/recover',
    handler: 'AuthController.recover'
  },
  {
    method: ['GET','POST'],
    path: '/auth/logout',
    handler: 'AuthController.logout',
    config: {
      app: {
        proxyRouter: {
          ignore: true
        }
      }
    }
  },
  {
    method: ['GET'],
    path: '/auth/session',
    handler: 'AuthController.session',
    config: {
      app: {
        proxyRouter: {
          ignore: true
        }
      }
    }
  },
]
