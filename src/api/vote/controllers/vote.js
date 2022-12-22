'use strict';

/**
 * vote controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::vote.vote', ({ strapi }) =>  ({  
  async create(ctx) {
    
    const vote = ctx.request.body.data

    //check if there is already a promise with status in vote
    const promises = await strapi.entityService.findMany('api::promise.promise', {
      filters: { status: 'IN_VOTE', country: vote.country },
      populate: '*'
    })
    if(promises.length > 0) {
      return ctx.badRequest('There is already a Vote in Session', {  })
    }
    
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
    vote.partyId = partyId
    strapi.io.to(ctx.request.body.data.country).emit('new_vote', vote)

    return response;
  },

  
}));