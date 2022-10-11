'use strict';

/**
 * country service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::country.country', ({ strapi }) => ({
  async copyDataFromTemplate(templateId, countryId, entityName) {
    const entries = await strapi.entityService.findMany(`api::${entityName}.${entityName}`, {        
        filters: { country: templateId },        
      });
      entries.forEach(async (entry) => {
        entry.country = countryId
        entry.id = undefined
        await strapi.entityService.create(`api::${entityName}.${entityName}`, {
          data: entry
        })
      });
  },

}));