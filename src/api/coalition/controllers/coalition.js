'use strict';

/**
 * coalition controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::coalition.coalition', ({ strapi }) =>  ({  
  async create(ctx) {
    //validate that no coaltion exists with same parties
    const { parties } = ctx.request.body.data
    const coalitions = await strapi.entityService.findMany('api::coalition.coalition', {
      filters: { parties: parties },
      populate: '*'
    })
    if (coalitions.length > 0) {
      let found = false
      coalitions.forEach((c) => {
        if (c.parties.length === parties.length && c.parties.every((v,i) => parties.indexOf(v.id)>=0)) {
          found = true          
        }
      })
      if(found) {
        return ctx.badRequest('A coalition with these parties already exists', {})
      }
    }
    //check that coalition should have atleast 2 parties
    if (parties.length < 2) {
      return ctx.badRequest('Coalition should have atleast 2 parties', {})
    }

    const response = await super.create(ctx);

    strapi.io.to(ctx.request.body.data.country).emit('new_coalition', {id:response.id, name:response.name})

    return response    
    
  },

  
}));