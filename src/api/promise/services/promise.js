'use strict';

/**
 * promise service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::promise.promise', ({ strapi }) => ({
  async updatePartySupport(groups, partyId, coeff) {
    groups.map(async (group) => {
      const blocks = await strapi.entityService.findMany('api::block.block', {      
        filters: { demographics: group.id },        
      });      
      blocks.map(async (block) => {        
        const party_support = await strapi.entityService.findMany('api::party-support.party-support', {      
          filters: { block: block.id, party: partyId },        
        });                
        party_support.map(async (p) => {          
          await strapi.entityService.update('api::party-support.party-support', p.id, {
            data: {
              support: Math.ceil(p.support * coeff),
            },
          });
        })        
      })
    })
  },

}));