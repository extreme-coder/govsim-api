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

    const vote = await strapi.entityService.findOne('api::vote.vote', ballot.vote, {
      populate: { promise: true }
    })

    const bill = await strapi.entityService.findOne('api::promise.promise', vote.promise.id, {
      populate: '*'
    })
    const l = await strapi.entityService.findOne('api::law.law', bill.law.id, {
      populate: '*'
    })
    await strapi.service('api::promise.promise').updatePartySupport(l.groups_against, party.id, 0.9)

    if (ballotNum === partyNum) {
      const ballots = await strapi.entityService.findMany('api::ballot.ballot', {
        filters: { vote: ballot.vote },
        populate: { party: true }
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
        const promises = await strapi.entityService.findMany('api::promise.promise', {
          filters: {
            country: ballot.country,
            law: law.id
          }
        })
        
        promises.map(async (p) => {
          await strapi.entityService.update('api::promise.promise', p.id, {
            data: { status: 'PASSED' }
          })
        })
        await strapi.entityService.create('api::story.story', {
          data: {
            headline: `${bill.name} passed!`,
            body: `After a long session of parliament, MPs managed to get ${bill.name}, the new bill in support of ${law.name} passed with a close majority.`,
            country: bill.country.id,
            party: bill.party.id,
            all_parties: true,
            publishedAt: new Date()
          },
        });
        await strapi.entityService.update('api::party.party', bill.party.id, {
          data: { points: parseInt(bill.party.points) + 100 }
        })

        strapi.io.to(party.country.id).emit('vote_passed', bill)

      } else {        
        await strapi.entityService.update('api::vote.vote', vote.id, {
          data: { status: 'FAILED' }
        })
        await strapi.entityService.update('api::promise.promise', bill.id, {
          data: { status: 'FAILED' }
        })
        strapi.io.to(party.country.id).emit('vote_failed', bill)
      }
      //update the turn of parties
      await strapi.service('api::party.party').updateTurn(party.country.id)

    }

    return response;
  },




}));