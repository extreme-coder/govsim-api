'use strict';

/**
 * promise service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::promise.promise');