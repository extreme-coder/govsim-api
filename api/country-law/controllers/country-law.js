'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Update a record.
   *
   * @return {Object}
   */

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    console.log(ctx.request.body)
    entity = await strapi.services['country-law'].update({ id }, ctx.request.body);
    //activate modifiers
    const law = await strapi.services.law.findOne({ id: entity.passed_law.id })
    law.modifiers.map(async (mod) => {
      const statID = mod.affected_stat
      const change = mod.amount 
      const stat = await strapi.services['country-stat'].findOne(statID)
      const val = stat.value
      const newVal = val + change
      await strapi.services['country-stat'].update(statID, {"value": newVal})
    })
    //activate effects
    law.effects.map(async (effect) => {
      let stats = await strapi.services['population-attribute'].find()
      if (effect.prereq != null) {
        stats = stats.filter(stat => (stat.value == effect.prereq))
      }
      stats.map(async (stat) => {
        //if (Math.random() * 100 < effect.probability) {
          await strapi.services['population-attribute'].update(stat.id, { "value": effect.new_trait })
        //}
      })
    })
    return sanitizeEntity(entity, { model: strapi.models.country_law });
  },
};
