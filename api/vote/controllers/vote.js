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
        const c = entity.country.id
        
        strapi.io.sockets.in(c).emit('newVote', entity)
        return sanitizeEntity(entity, { model: strapi.models.promise });
    },
};
