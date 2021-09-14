'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
        entity = await strapi.services.promise.create(data, { files });
        console.log('test')
    } else {
        entity = await strapi.services.promise.create(ctx.request.body);
        const law = await strapi.services.law.findOne({ id: entity.law.id });
        console.log(law)
        const supporters = law.groups_support
        const against = law.groups_against
        const blocks = await strapi.services.blocks
        console.log(blocks)
    }
    return sanitizeEntity(entity, { model: strapi.models.promise });
  },
};
