'use strict';

/**
 * party service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::party.party', ({ strapi }) => ({
  async getEfficiency(partyId) {
    const promises = await strapi.entityService.findMany('api::promise.promise', { filters: { party: partyId }, populate: { country_law: true, law: true } })
    let total = 0
    let passed = 0
    promises.map(async (p) => {
      const c = await strapi.entityService.findOne('api::country-law.country-law', p.country_law.id, { populate: { passed_law: true } })
      if (c.passed_law.id === p.law.id) {
        passed++
      }
      if (p.status !== "NEW") {
        total++
      }
    })
    if (total === 0) {
      return 1
    }
    return parseFloat(passed)/parseFloat(total)
  },
  async joinParliament(partyId) {
    console.log("service called")
    const promises = await strapi.entityService.findMany('api::promise.promise', { filters: { party: partyId } })
    promises.map(async (p) => {
      console.log(`status is ${p.status}`)
      if (p.status === "NEW") {
        await strapi.entityService.update('api::promise.promise', p.id, { data: { status: "PROPOSED" } })
      }
    })
  },
  async updateTurn(countryId) {
    let party = null
    //get all parties
    const parties = await strapi.entityService.findMany('api::party.party', { filters: { country: countryId } })
    //loop thru parties and party after the prty with is_your_turn = true is the next party
    for(let i = 0; i < parties.length; i++) {
      if (parties[i].is_turn) {
        if (i === parties.length - 1) {
          await strapi.entityService.update('api::party.party', parties[0].id, { data: { is_turn: true } })
          party = parties[0]
          //a round is finished, increment round on country
          const country = await strapi.entityService.findOne('api::country.country', countryId)
          const newRound = country.round + 1
          await strapi.entityService.update('api::country.country', countryId, { data: { round: newRound } })
          //if round is equal to campign_rounds, call election
          if (newRound === country.campaign_rounds) {
            await strapi.entityService.create('api::election.election', {
              data: {
                country: countryId,
                publishedAt: new Date()
              },
            })            
            //update country status to ELECTIONS
            await strapi.entityService.update('api::country.country', countryId, { data: { status: "ELECTIONS" } })
            //send socket message to country for election
            strapi.io.to(countryId).emit('election_underway', {})            
          }                    
          if (newRound === country.campaign_rounds + country.parliament_rounds) {
            //update country status to CAMPAIGN
            await strapi.entityService.update('api::country.country', countryId, { data: { status: "CAMPAIGN" } })            
            strapi.io.to(countryId).emit('country_status_change', {status:'CAMPAIGN'})  
          }

        } else {          
          await strapi.entityService.update('api::party.party', parties[i+1].id, { data: { is_turn: true } })
          party = parties[i+1]
        }
        await strapi.entityService.update('api::party.party', parties[i].id, { data: { is_turn: false } })
        break
      }
    }
    //send socket message to country that turn has changed
    strapi.io.to(countryId).emit('new_turn', {party:party})
  }

}));