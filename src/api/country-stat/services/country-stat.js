'use strict';

/**
 * country-stat service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::country-stat.country-stat');