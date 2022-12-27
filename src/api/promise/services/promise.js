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
        populate: { preferred_party: true, demographic: true, country: true }
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
          if (s > block.highest_support && ((!(block.preferred_party) || p.party.id !== block.preferred_party.id))) {
            await strapi.entityService.update('api::block.block', block.id, {
              data: {
                highest_support: parseInt(s),
                preferred_party: p.party.id
              },
            });
            const st = await strapi.entityService.create('api::story.story', {
              data: {
                headline: `${block.demographic.name} endorse ${p.party.name} in upcoming election`,
                body: `Owing to recent campaign initiatives announced by the ${p.party.name}, numerous ${block.demographic.name} organizations across ${block.country.name} have decided to pledge their support.`,
                is_decision: false,
                country: block.country.id,
                party: p.party.id
              },
            });
          }
        })        
      })
    })
  },

}));