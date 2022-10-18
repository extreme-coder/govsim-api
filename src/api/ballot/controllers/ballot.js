'use strict';

/**
 * ballot controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::ballot.ballot', ({ strapi }) => ({
  async create(ctx) {
    const ballot = ctx.request.body.data

    //check if a promise is already created with same parameters
    const matchingBallots = await strapi.entityService.findMany('api::ballot.ballot', {
      filters: { party: ballot.party, vote: ballot.vote }
    });

    if (matchingBallots.length > 0) {
      return ctx.badRequest('You have already cast a ballot for this vote', {})
    }

    const response = await super.create(ctx);

    const ballotNum = await strapi.entityService.count('api::ballot.ballot', {
      filters: { vote: ballot.vote }
    })
    console.log(ballotNum)

    const party = await strapi.entityService.findOne('api::party.party', ballot.party, {
      populate: { country: true }
    })

    const partyNum = await strapi.entityService.count('api::party.party', {
      filters: { country: party.country.id }
    })
    console.log(partyNum)

    if (ballotNum === partyNum) {
      const ballots = await strapi.entityService.findMany('api::ballot.ballot', {
        filters: { vote: ballot.vote },
        populate: { party: true }
      })
      const vote = await strapi.entityService.findOne('api::vote.vote', ballot.vote, {
        populate: { promise: true }
      })
      const bill = await strapi.entityService.findOne('api::promise.promise', vote.promise.id, {
        populate: { country_law: true, law: true }
      })

      const law = bill.law
      const countryLaw = bill.country_law

      let votesFor = 0
      let votesAgainst = 0
      await Promise.all(ballots.map(async (b) => {

        if (b.for) {
          votesFor += b.party.seats
        } else {
          votesAgainst += b.party.seats
        }
      }))
      console.log('votes for:')
      console.log(votesFor)
      console.log('votes against:')
      console.log(votesAgainst)
      if (votesFor >= votesAgainst) {
        console.log("country law:")
        console.log(countryLaw.id)
        console.log("law:")
        console.log(law.id)
        await strapi.entityService.update('api::country-law.country-law', countryLaw.id, {
          data: { passed_law: law.id }
        })
        await strapi.entityService.update('api::vote.vote', vote.id, {
          data: { status: 'PASSED' }
        })
      } else {        
        await strapi.entityService.update('api::vote.vote', vote.id, {
          data: { status: 'FAILED' }
        })
      }
    }

    return response;
  },




}));