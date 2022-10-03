'use strict';

/**
 * crisis service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::crisis.crisis');