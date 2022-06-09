'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
    async create(ctx) {
        let entity;
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.election.create(data, { files });
        } else {
            entity = await strapi.services.election.create(ctx.request.body);
        }
        const parties = await strapi.services.party.find({ country: entity.country.id })
        let votes = {}
        parties.map((par) => {
            votes[par.id] = 0
        })
        const blocks = await strapi.services.block.find({ country: entity.country.id })
        let total = 0
        
        await Promise.all(blocks.map( async (block) => {
            let topSupport = 0
            let topParty = 0
            let supports = await strapi.services["party-support"].find({ block: block.id })
            
            supports.map( (s) => {
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
                await strapi.services["party-result"].create({
                    party: p.id,
                    election: entity.id,
                    seats: votes[p.id.toString(10)] / total * 50
                })
            } catch (e) {
                console.log(e.data.errors)
            }
            await strapi.services.party.update({ id: p.id }, { "seats": votes[p.id.toString(10)] / total * 50 })
        }))
       
        return sanitizeEntity(entity, { model: strapi.models.promise });
    },
};
