'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
    async create(ctx) {
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services["ballot"].create(data, { files });
        } else {
            entity = await strapi.services["ballot"].create(ctx.request.body);
        }
        const ballots = await strapi.services.ballot.find({ country: entity.country.id })
        const ballotNum = await strapi.services.ballot.count()
        const partyNum = await strapi.services.party.count()
        console.log(ballotNum)
        console.log(partyNum)
        if (ballotNum === partyNum) {
            const vote = await strapi.services["vote"].findOne({ id: entity.vote.id })
            const promise = await strapi.services["promise"].findOne({ id: vote.promise.id })
            const law = await strapi.services["law"].findOne({ id: promise.law.id })
            const countryLaw = await strapi.services["country-law"].findOne({ id: promise.country_law.id })
            let votesFor = 0
            let votesAgainst = 0
            await Promise.all(ballots.map(async (b) => {
                const p = await strapi.services["party"].find({ id: b.party.id })
                if (b.for) {
                    votesFor += p[0]['seats']
                } else {
                    votesAgainst += p[0]['seats']
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
                await strapi.services["country-law"].update({ id: countryLaw.id }, { "passed_law": law.id })
            }
        }
        return sanitizeEntity(entity, { model: strapi.models.ballot });
    },
};