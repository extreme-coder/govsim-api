'use strict';

/**
 * election controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::election.election', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);
    return response;
  }
}));