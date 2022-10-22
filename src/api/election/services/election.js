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
    const blocks = await strapi.service('api::block.block').find({ country: countryID })
    let total = 0

    await Promise.all(blocks.results.map(async (block) => {
      console.log(block)
      let topSupport = 0
      let topParty = 0
      let supports = await strapi.entityService.findMany('api::party-support.party-support', {
        filters: { block: block.id },
        populate: { party: true }
      })

      supports.map((s) => {
        console.log(s)
        if (parseInt(s.support) > topSupport) {
          topSupport = parseInt(s.support)
          topParty = s.party.id
        }
      })

      votes[topParty] += 1000
      total += 1000
    }))

    console.log(votes)
    await Promise.all(parties.map(async (p) => {
      try {
        /* await strapi.service('api::party-result.party-result').create({
            party: p.id,
            election: electionID,
            seats: votes[p.id.toString(10)] / total * 50
        }) */
      } catch (e) {
        console.log(e)
      }
      await strapi.entityService.update('api::party.party', p.id, {
        data: {
          seats: votes[p.id.toString(10)] / total * 50
        },
      });

    }))

  },

}));