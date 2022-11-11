'use strict';

/**
 * election service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::election.election', ({ strapi }) => ({
  async callElection(countryID, electionID) {
    let parties = await strapi.service('api::party.party').find({ country: countryID })
    parties = parties.results
    let votes = {}
    parties.map(async (par) => {
      votes[par.id] = 0
      await strapi.entityService.update('api::party.party', par.id, {
        data: {ready_for_election: false}
      })
    })

    const blocks = await strapi.entityService.findMany('api::block.block', { 
      filters: {country: countryID}
    })
    let total = 0
    let outParties = [] 

    await Promise.all(blocks.map(async (block) => {
      console.log(block)
      let topSupport = 0
      let topParty = -1
      let supports = await strapi.entityService.findMany('api::party-support.party-support', {
        filters: { block: block.id },
        populate: { party: true }
      })
      supports.map((s) => {
        console.log(s)
        console.log(topSupport)
        if ( parseInt(s.support) > topSupport && !outParties.includes(s.party.id) ) {
          topSupport = parseInt(s.support)
          topParty = s.party.id
        }
      })
      console.log(topParty)
      votes[topParty] += 1000
      if (votes[topParty] / 1000 >= blocks.length / 2 - 1){
        outParties.push(topParty)
      }
      total += 1000
      await strapi.entityService.create('api::block-result.block-result', {
        data: {
          block: block.id,
          party: topParty,
          election: electionID,
          publishedAt: new Date()
        }
      })
    }))

    console.log(votes)
    await Promise.all(parties.map(async (p) => {
      console.log(votes[p.id.toString(10)])
      console.log(total)

      await strapi.entityService.update('api::party.party', p.id, {
        data: {
          seats: (votes[p.id.toString(10)] * 400) / total 
        },
      });

    }))

    await strapi.entityService.update('api::country.country', countryID, {
      data: {
        elections_occurred: true
      }
    })

  },

}));