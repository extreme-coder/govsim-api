'use strict';

/**
 * election controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::election.election', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);
    await strapi.entityService.update('api::country.country', ctx.request.body.data.country, {
      data: {
        elections_occurred: true
      }
    })
    return response;
  }
}));