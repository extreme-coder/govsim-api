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
    let budgets = {}
    parties.map(async (par) => {
      votes[par.id] = 0
      budgets[par.id] = 0
      effs[par.id] = await strapi.service('api::party.party').getEfficiency(par.id)
      await strapi.entityService.update('api::party.party', par.id, {
        data: {
          ready_for_election: false,
        }
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
        budgets[topParty] = parseInt(budgets[topParty]) + parseInt(block.wealth)
      }
    }))

    console.log(votes)
    let leftOutParties = []
    let leftOutCount = 0.0
    let leftOutSeats = 40.0
    await Promise.all(parties.map(async (p) => {
      const prevSeats = p.seats
      if (votes[p.id.toString(10)] > 0) {
        await strapi.service('api::party.party').joinParliament(p.id)
      }
      let seats_won = Math.floor((votes[p.id.toString(10)] * 360) / total)
      await strapi.entityService.update('api::party.party', p.id, {
        data: {
          seats: seats_won,
          budget: budgets[p.id.toString(10)]
        },
      });
      
      await strapi.service('api::socrecard.socrecard').addScore(p.id, seats_won*10, 'Seats won :' +  seats_won, 'SEATS_WON')

      if (Math.floor((votes[p.id.toString(10)] * 360) / total) === 0) {
        leftOutParties.push(p.id)
        leftOutCount++
      }
      if (prevSeats === 0 && Math.floor((votes[p.id.toString(10)] * 400) / total !== 0)) {
        await strapi.entityService.create('api::story.story', {
          data: {
            headline: `Newcomer party joins ${country.name} parliament`,
            body: `The elections concluded yesterday, and brought sweeping changes to Parliament; among these was the ${p.name}, who now have members in parliament for the first time! Time will tell whether their initiatives will have any success in the cuthroat world of ${country.name} politics.`,
            country: countryID,
            party: p.id,
            publishedAt: new Date()
          },
        });
      }
      if (prevSeats > Math.floor((votes[p.id.toString(10)] * 400) / total !== 0)) {
        let headline = ""
        switch(Math.floor(Math.random()*5)) {
          case 0:
            headline = `${p.name} Suffer Heavy Losses in Recent Election`
          case 1:
            headline = `${p.name} Lose Ground in Recent Election`
          case 2:
            headline = `${p.name} Experience Electoral Setback`
          case 3:
            headline = `${p.name} Experience Defeat at the Polls`
          default:
            headline = `${p.name} Endure Electoral Defeat`
        }
        let lostSeats = prevSeats - Math.floor((votes[p.id.toString(10)] * 400) / total !== 0)
        let body = ""
        switch(Math.floor(Math.random()*5)) {
          case 0:
            body = `Multiple MPs from the ${p.name} were seen leaving the parliament chambers today as results from the recent election rolled in. The ${p.name} lost ${lostSeats} seats. Will they ever recover from this defeat?`
          case 1:
            body = `As the latest election results were released, several representatives of the ${p.name} were observed exiting the legislature. The ${p.name} suffered a loss of ${lostSeats} seats. Is there any hope for a political comeback?`
          case 2:
            body = `Upon the announcement of the recent election results, multiple politicians from the ${p.name} were seen leaving the chambers of the legislature. The recent elections resulted in a loss of ${lostSeats} seats for their party. Can the ${p.name} regain their footing following this major defeat?`
          case 3:
            body = `As the most recent election results were made public, numerous members of the ${p.name} were seen leaving the parliamentary building. This resulted in a loss of ${lostSeats} seats. Will the ${p.name} be able to recover from this major setback?`
          default:
            body = `Heavy traffic jams were observed around the Parliament Building today, as members of the ${p.name} exited following the announcement of the latest election results. ${lostSeats} ${p.name} seats were lost in the excitement of the recent election. Can the ${p.name} reverse their fortunes after this defeat?`
        }
        await strapi.entityService.create('api::story.story', {
          data: {
            headline: headline,
            body: body,
            country: countryID,
            party: p.id,
            publishedAt: new Date()
          },
        });
      }
    }))

    leftOutParties.map(async (partyID) => {
      const s = Math.floor(leftOutSeats / leftOutCount) + Math.round(Math.random()*4) - 2
      leftOutSeats -= s
      leftOutCount--
      await strapi.entityService.update('api::party.party', partyID, {
        data: {
          seats: s,
          budget: budgets[partyID.toString(10)]
        }
      })
    })

    await strapi.entityService.update('api::country.country', countryID, {
      data: {
        elections_occurred: true, status: 'COALITIONS'
      }
    })

  },

}));