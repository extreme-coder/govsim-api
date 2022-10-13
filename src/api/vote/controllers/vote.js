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

    //get party from user
    const userId = ctx.state.user.id
    const party = await strapi.entityService.findMany('api::party.party', {
      filters: {user: userId, country:ctx.request.body.data.country}
    })
    
    const partyId = party[0].id
    await strapi.entityService.create('api::ballot.ballot', {data:{
      vote: response.data.id,
      for: true, 
      party: partyId, 
      publishedAt: new Date() }
    });

    return response;
  },

  
}));