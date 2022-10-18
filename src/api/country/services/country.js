'use strict';

/**
 * country service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::country.country', ({ strapi }) => ({
  async copyDataFromTemplate(templateId, countryId, entityName) {
    const entries = await strapi.entityService.findMany(`api::${entityName}.${entityName}`, {        
        filters: { country: templateId },      
        populate: '*'  
      });
      entries.forEach(async (entry) => {
        entry.country = countryId
        entry.id = undefined
        entry.createdBy = undefined
        entry.updatedBy = undefined
        console.log(entry)
        await strapi.entityService.create(`api::${entityName}.${entityName}`, {
          data: entry
        })
      });
  },

}));