'use strict';

/**
 * party service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::party.party', ({ strapi }) => ({
  async getEfficiency(partyId) {
    const promises = await strapi.entityService.findMany('api::promise.promise', { filters: { party: partyId } })
    let total = 0
    let passed = 0
    promises.map((p) => {
      if (p.status === "PASSED") {
        passed++
      }
      if (p.status !== "NEW") {
        total++
      }
    })
    return parseFloat(passed)/parseFloat(total)
  },

}));