'use strict';

/**
 * vote controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::vote.vote', ({ strapi }) =>  ({  
  async create(ctx) {
    
    const vote = ctx.request.body.data
    
    await strapi.entityService.update('api::promise.promise', vote.promise, {
      data: {
        status: 'IN_VOTE',
      },
    });

    const response = await super.create(ctx);    
    return response;
  },

  
}));