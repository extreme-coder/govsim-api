'use strict';

/**
 * election service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::election.election', ({ strapi }) => ({
  async callElection(countryID, electionID) {
    let parties = await strapi.entityService.findMany('api::party.party', {
      filters: {
        country: countryID
      }
    })
    //parties = parties.results
    let votes = {}
    let effs = {}
    parties.map(async (par) => {
      votes[par.id] = 0
      effs[par.id] = await strapi.service('api::party.party').getEfficiency(par.id)
      await strapi.entityService.update('api::party.party', par.id, {
        data: {ready_for_election: false}
      })
    })
    console.log("starting votes:")
    console.log(votes)
    const blocks = await strapi.entityService.findMany('api::block.block', { 
      filters: {country: countryID}
    })
    let total = 0
    let outParties = [] 
    const country = await strapi.entityService.findOne('api::country.country', countryID)

    await Promise.all(blocks.map(async (block) => {
      let topSupport = 0
      let topParty = -1
      let supports = await strapi.entityService.findMany('api::party-support.party-support', {
        filters: { block: block.id },
        populate: { party: true }
      })
      supports.map((s) => {
        if ( parseInt(s.support) >= topSupport && !outParties.includes(s.party.id) ) {
          topSupport = parseInt(s.support)
          topParty = s.party.id
        }
      })
      if (topParty !== -1) {
        console.log('effs:')
        console.log(effs)
        votes[topParty] += (5000 + 5000 * effs[topParty])
        if (votes[topParty] / 10000 >= blocks.length / 2 - 1){
          outParties.push(topParty)
        }
        total += (5000 + 5000 * effs[topParty]) 
        await strapi.entityService.create('api::block-result.block-result', {
          data: {
            block: block.id,
            party: topParty,
            election: electionID,
            publishedAt: new Date()
          }
        })
        let p = await strapi.entityService.findOne('api::party.party', topParty)
        await strapi.entityService.update('api::party.party', topParty, {
          data: { budget: (parseInt(p.budget) + parseInt(block.wealth)) }
        })

      }
    }))

    console.log(votes)
    await Promise.all(parties.map(async (p) => {
      const prevSeats = p.seats
      if (votes[p.id.toString(10)] > 0) {
        await strapi.service('api::party.party').joinParliament(p.id)
      }
      var points = parseInt(p.points) + parseInt((votes[p.id.toString(10)] * 4000) / total)
      await strapi.entityService.update('api::party.party', p.id, {
        data: {
          seats: Math.floor((votes[p.id.toString(10)] * 400) / total),
          points: points 
        },
      });
      if (prevSeats === 0 && Math.floor((votes[p.id.toString(10)] * 400) / total !== 0)) {
        await strapi.entityService.create('api::story.story', {
          data: {
            headline: `Newcomer party joins ${country.name} parliament`,
            body: `The elections concluded yesterday, and brought sweeping changes to Parliament; among these was the ${p.name}, who now have members in parliament for the first time! Time will tell whether their initiatives will have any success in the cuthroat world of ${country.name} politics.`,
            country: countryID,
            party: p.id,
          },
        });
      }
      if (prevSeats > Math.floor((votes[p.id.toString(10)] * 400) / total !== 0)) {
        await strapi.entityService.create('api::story.story', {
          data: {
            headline: `${p.name} suffers heavy losses in recent election`,
            body: `Multiple MPs from the ${p.name} were seen leaving the parliament chambers today as results from the recent election rolled in. The ${p.name} lost ${prevSeats - Math.floor((votes[p.id.toString(10)] * 400) / total !== 0)} seats. Will they ever recover from this defeat?`,
            country: countryID,
            party: p.id,
          },
        });
      }
    }))

    await strapi.entityService.update('api::country.country', countryID, {
      data: {
        elections_occurred: true, status: 'PARLIAMENT'
      }
    })

  },

}));