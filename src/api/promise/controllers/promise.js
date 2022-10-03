'use strict';

/**
 * promise controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::promise.promise');