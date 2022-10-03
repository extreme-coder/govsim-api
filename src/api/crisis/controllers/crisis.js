'use strict';

/**
 * crisis controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::crisis.crisis');