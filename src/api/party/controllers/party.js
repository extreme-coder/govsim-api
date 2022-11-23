'use strict';

/**
 * party controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::party.party', ({ strapi }) => ({

  async create(ctx) {

    const partyTemplate = await strapi.entityService.findOne('api::party-template.party-template', ctx.request.body.data.template)

    ctx.request.body.data = {
      ...ctx.request.body.data,
      user: ctx.state.user.id,
      publishedAt: new Date(),      
      budget: partyTemplate.default_budget
    };

    // check party name should be less than 30 characters
    if (ctx.request.body.data.name.length > 30) {
      return ctx.badRequest('Party name should be less than 30 characters', {  });
    }

    
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
      const countryBlock = await strapi.entityService.findMany('api::block.block', {
        filters: { parent_block: ps.block.id, country: ctx.request.body.data.country }
      })
      ps.block = countryBlock[0].id    
      const newPs = await strapi.entityService.create('api::party-support.party-support', {
        data: ps
      }) 
    })

    strapi.io.to(ctx.request.body.data.country).emit('new_party', {id:response.id, name:response.name})

    return response;
  },

  async update(ctx) {    
    const { data, meta } = await super.update(ctx)
    
    //load party with country
    const party = await strapi.entityService.findOne('api::party.party', data.id, {
      populate: '*'
    })

    //check if all parties are ready for election
    let parties = await strapi.entityService.findMany('api::party.party', {
      filters: { country: party.country.id, ready_for_election: false }
    })
    if(parties.length === 0) {
      //change country status to campaign
      await strapi.entityService.update('api::country.country', party.country.id, {
        data: {
          status: 'CAMPAIGN',
          next_election: new Date(new Date().getTime() + party.country.campaign_period * 60000)
        }
      })
    }

    
    // check if all parties have finished their campaign 
    parties = await strapi.entityService.findMany('api::party.party', {
      filters: { country: party.country.id, finished_campaign: false }
    })
    
    if (parties.length == 0) {
      //all parties ready 
      await strapi.entityService.create('api::election.election', {
        data: {
          country: party.country.id,
          publishedAt: new Date()
        },
      })
      await strapi.entityService.update('api::country.country', party.country.id, {
        data: {
          elections_occurred: true, status: 'ELECTIONS'
        }
      })
      strapi.io.to(party.country.id).emit('election_underway', {})
    }
    
    if(ctx.request.body.data.ready_for_election) {
      strapi.io.to(party.country.id).emit('ready_for_election', {id:data.id, name:data.attributes.name})
    }
    if(ctx.request.body.data.finished_campaign) {
      strapi.io.to(party.country.id).emit('finished_campaign', {id:data.id, name:data.attributes.name})
    }
  
    return { data, meta }
  }

}));