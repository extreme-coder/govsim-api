'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async create(ctx) {
        let entity
        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx);
            entity = await strapi.services.crisis_vote.create(data, { files });
        } else {
            entity = await strapi.services.crisis_vote.create(ctx.request.body);
        }
        const ballots = await strapi.services["crisis-ballot"].find({ crisis_vote: entity.id })
        const decIDs = ballots.map((b) => (b.decision.id))
        const chosenDecID = decIDs.sort((a, b) => decIDs.filter(v => v === a).length - decIDs.filter(v => v === b).length).pop()
        const chosenDec = await strapi.services["decision"].findOne({ id: chosenDecID })
        console.log(chosenDec)
    }
};
