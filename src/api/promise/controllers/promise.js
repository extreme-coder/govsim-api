'use strict';

/**
 * promise controller
 */


const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::promise.promise', ({ strapi }) =>  ({  
  async create(ctx) {
 
    const pr = ctx.request.body.data;
    pr.law_type = pr['law-type']
    
    //validate that promise has a name
    if(!pr.name) {
      return ctx.badRequest('Bill must have a name', {  })
    }

    //check if a promise is already created with same parameters
    const bills = await strapi.entityService.findMany('api::promise.promise', {      
      filters: { party: pr.party, law_type: pr.law_type, status:['NEW', 'PROPOSED'] }  
    });

    if(bills.length > 0) {
      return ctx.badRequest('You already have a similar bill', {  })
    }

    const party = await strapi.entityService.findOne('api::party.party', pr.party, {      
      populate: { country: true},
    });

    ctx.request.body.data.country = party.country.id

    const law = await strapi.entityService.findOne('api::law.law', pr.law, {      
      populate: { groups_against: true,  groups_support: true},
    });
    strapi.service('api::promise.promise').updatePartySupport(law.groups_against, pr.party, 0.8)
    strapi.service('api::promise.promise').updatePartySupport(law.groups_support, pr.party, 1.2)   
    
    const response = await super.create(ctx);      

    strapi.io.to(party.country.id).emit('new_bill', {id:response.id, name:response.name})
  
    return response;
  },

  
}));