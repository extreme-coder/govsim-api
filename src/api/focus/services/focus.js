'use strict';

/**
 * focus service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::focus.focus');