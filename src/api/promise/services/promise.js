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
        populate: { preferred_party: true }
      });
      blocks.map(async (block) => {        
        const party_support = await strapi.entityService.findMany('api::party-support.party-support', {      
          filters: { block: block.id, party: partyId },
          populate: {party: true}
        });
        party_support.map(async (p) => {   
          let s = Math.ceil(p.support * coeff)
          await strapi.entityService.update('api::party-support.party-support', p.id, {
            data: {
              support: s,
            },
          });
          if (s > block.highest_support && (p.party.id !== block.preferred_party.id) && !(block.preferred_party)) {
            if (block.preferred_party) {
              await strapi.entityService.update('api::party.party', block.preferred_party.id, {
                data: {
                  budget: parseInt(block.preferred_party.budget) - parseInt(block.wealth)
                },
              });
            }
            await strapi.entityService.update('api::party.party', p.party.id, {
              data: {
                budget: parseInt(p.party.budget) + parseInt(block.wealth)
              },
            });
            await strapi.entityService.update('api::block.block', block.id, {
              data: {
                highest_support: parseInt(s),
                preferred_party: p.party.id
              },
            });
          }
        })        
      })
    })
  },

}));