'use strict';

/**
 * party controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::party.party', ({ strapi }) => ({
  async create(ctx) {
    ctx.request.body.data = {
      ...ctx.request.body.data,
      user: ctx.state.user.id,
      publishedAt: new Date()
    };

    const response = await strapi.entityService.create('api::party.party', ctx.request.body);
    const partySupports = await strapi.entityService.findMany('api::party-support.party-support', {
      filters: {party_template: ctx.request.body.data.template},
      populate: '*'
    })

    partySupports.forEach(async (ps) => {
      ps.party = response.id
      ps.id = undefined
      ps.party_template = undefined
      ps.createdBy = undefined
      ps.updatedBy = undefined
      const newPs = await strapi.entityService.create('api::party-support.party-support', {
        data: ps
      }) 
    })

    return response;
  },

  async update(ctx) {
    const { data, meta } = await super.update(ctx)
    
    //load party with country
    const party = await strapi.entityService.findOne('api::party.party', data.id, {
      populate: '*'
    })
    
    // check if all parties are ready
    const parties = await strapi.entityService.findMany('api::party.party', {
      filters: { country: party.country.id, ready_for_election: false }
    })
    
    if (parties.length == 0) {
      //all parties ready 
      await strapi.entityService.create('api::election.election', {
        data: {
          country: party.country.id,
          publishedAt: new Date()
        },
      })
    }
    return { data, meta }
  }

}));