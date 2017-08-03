/**
 * Trailpack Configuration
 *
 * @see {@link http://trailsjs.io/doc/trailpack/config
 */
module.exports = {

  /**
   * API and config resources provided by this Trailpack.
   */
  provides: {
    api: {
      controllers: ['AuthController'],
      services: ['PassportService'],
      models: ['User','Passport']
    },
    config: [ ]
  },

  /**
   * Configure the lifecycle of this pack; that is, how it boots up, and which
   * order it loads relative to other trailpacks.
   */
  lifecycle: {
    configure: {
      /**
       * List of events that must be fired before the configure lifecycle
       * method is invoked on this Trailpack
       */
      listen: [
        'trailpack:sequelize:configured',
        'trailpack:proxy-engine:configured'
      ],

      /**
       * List of events emitted by the configure lifecycle method
       */
      emit: [
        'trailpack:proxy-passport:configured'
      ]
    },
    initialize: {
      listen: [
        'trailpack:sequelize:initialized',
        'trailpack:proxy-engine:initialized'
      ],
      emit: [
        'trailpack:proxy-passport:initialized'
      ]
    }
  }
}
