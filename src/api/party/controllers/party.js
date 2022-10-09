'use strict';

/**
 * party controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::party.party', ({ strapi }) =>  ({  
  async create(ctx) {        
    ctx.request.body.data = {
      ...ctx.request.body.data,
      user: ctx.state.user.id,  
      publishedAt: new Date()  
    };

    const response = await strapi.entityService.create('api::party.party', ctx.request.body);
    return response;
  },
  
}));