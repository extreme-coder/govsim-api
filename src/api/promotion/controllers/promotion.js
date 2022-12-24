'use strict';

/**
 * promotion controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::promotion.promotion', ({ strapi }) => ({
  async create(ctx) {

    console.log(ctx.request.body.data)
    //check if party has enough budget
    const partyId = ctx.request.body.data.party
    const party = await strapi.entityService.findOne('api::party.party', partyId)

    console.log(party)

    if(parseInt(party.budget) < parseInt(ctx.request.body.data.budget)) {
      return ctx.badRequest('Party does not have enough budget', {  })
    }
    
    const response = await super.create(ctx);
    const promotion = ctx.request.body.data;
 
    
  
    //reduce the budget of the party    
    await strapi.entityService.update('api::party.party', party.id, {      
      data: { budget:  parseInt(party.budget) - parseInt(promotion.budget)},
    });

    const promise = await strapi.entityService.findOne('api::promise.promise', promotion.promise, {      
      populate: { law: true , party: true },
    });
    const law = await strapi.entityService.findOne('api::law.law', promise.law.id, {      
      populate: { groups_against: true,  groups_support: true},
    });
    if (promotion.type === 'POSITIVE') {
      strapi.service('api::promise.promise').updatePartySupport(law.groups_support, promise.party.id, (1.5 - (promotion.budget / 100 - 10)**2 / 180))
      strapi.service('api::promise.promise').updatePartySupport(law.groups_against, promise.party.id, (0.5 + (promotion.budget / 100 - 10)**2 / 360))
    } else {
      strapi.service('api::promise.promise').updatePartySupport(law.groups_against, promotion.party, (1.25 - (promotion.budget / 100 - 10)**2 / 360))
    }

    return response;
  }
}));
