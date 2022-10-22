'use strict';

/**
 * promise service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::promise.promise', ({ strapi }) => ({
  async updatePartySupport(groups, partyId, coeff) {
    console.log(groups)
    groups.map(async (group) => {
      const blocks = await strapi.entityService.findMany('api::block.block', {      
        filters: { demographic: group.id },        
      });
      console.log(`blocks: ${blocks}`)
      blocks.map(async (block) => {        
        const party_support = await strapi.entityService.findMany('api::party-support.party-support', {      
          filters: { block: block.id, party: partyId },        
        });
        console.log(party_support)
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