'use strict';

/**
 * promise controller
 */


const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::promise.promise', ({ strapi }) =>  ({  
  async create(ctx) {
 
    const pr = ctx.request.body.data;

    const law = await strapi.entityService.findOne('api::law.law', pr.law, {      
      populate: { groups_against: true,  groups_support: true},
    });

    strapi.service('api::promise.promise').updatePartySupport(law.groups_against, pr.party, 0.8)
    strapi.service('api::promise.promise').updatePartySupport(law.groups_support, pr.party, 1.2)   
    
    const response = await super.create(ctx);        
    return response;
  },

  
}));