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
    } else {
      entity = await strapi.services.promise.create(ctx.request.body);
    }
    const law = await strapi.services["law"].findOne({ id: entity.law.id })
    law.groups_against.map(async (group) => {
      const blocks = await strapi.services.block.find({ demographics: group.id })
      blocks.map(async (block) => {
        let party_support = await strapi.services["party-support"].find({ "block": block.id })
        party_support = party_support.filter((p) => (p.party.id == entity.party.id))
        party_support.map(async (p) => {
          await strapi.services['party-support'].update({ id: p.id}, { "support": Math.ceil(p.support * 0.8)})
        })
      })
    })
    law.groups_for.map(async (group) => {
      const blocks = await strapi.services.block.find({ demographics: group.id })
      blocks.map(async (block) => {
        let party_support = await strapi.services["party-support"].find({ "block": block.id })
        party_support = party_support.filter((p) => (p.party.id == entity.party.id))
        party_support.map(async (p) => {
          await strapi.services['party-support'].update({ id: p.id}, { "support": Math.ceil(p.support * 1.2)})
        })
      })
    })
    return sanitizeEntity(entity, { model: strapi.models.promise });
  },
};
