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
        let body = ''
        switch (Math.floor(Math.random() * 5)) {
          case 0:
            body = `After a long session of parliament, MPs managed to get ${bill.name}, the new bill in support of ${law.name} passed with a close majority.`
          case 1:
            body = `After a lengthy parliamentary session, MPs were able to pass the new ${bill.name} bill, which provides support for ${law.name}, by a slim margin.`
          case 2:
            body = `Following a lengthy parliamentary session, MPs were successful in getting the ${bill.name} bill, which provides backing for ${law.name}, passed with a narrow majority.`
          case 3:
            body = `Upon a lengthy session of parliament, MPs achieved getting the ${bill.name} bill, which supports ${law.name}, approved`
          default:
            body = `After a close vote, MPs have passed the new ${bill.name} bill in support of ${law.name}, marking a significant win for today's parliamentary session.`
        }
        await strapi.entityService.create('api::story.story', {
          data: {
            headline: `${bill.name} Passed!`,
            body: body,
            country: bill.country.id,
            party: bill.party.id,
            all_parties: true,
            publishedAt: new Date()
          },
        });


        await strapi.service('api::scorecard.scorecard').addScore(bill.party.id, 200, 'Your Bill passed :' +  bill.name)


        const parties = await strapi.entityService.findMany('api::party.party')
        parties.forEach(async p => {
          if (ballots.filter(b => b.party.id === p.id)[0].for) {            
            await strapi.service('api::scorecard.scorecard').addScore(p.id, 100, 'You Voted for a Bill which passed :' +  bill.name)
          }
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