'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    console.log(ctx.request.body)
    let prevEntity = await strapi.services['party'].findOne({ id })
    entity = await strapi.services['party'].update({ id }, ctx.request.body)
    if (prevEntity.foci !== entity.foci) {
        let oldFoci = prevEntity.foci.map(f => f.id)
        let newFoci = entity.foci.map(f => f.id)
        let oldFocusID = oldFoci.filter((f) => (newFoci.indexOf(f) === -1))[0]
        let oldFocus = await strapi.services['focus'].findOne({ id: oldFocusID })
        let newFocusID = newFoci.filter((f) => (oldFoci.indexOf(f) === -1))[0]
        let newFocus = await strapi.services['focus'].findOne({ id: newFocusID })
        if (entity.expenses + newFocus.cost - oldFocus.cost > entity.budget) {
            return {}
        }
        switch (newFocus.type) {
            case "efficiency":
                let currentEf = entity.effectiveness_mod
                let newEf = currentEf + newFocus.modifier / 100
                if (newEf > 1) {
                    newEf == 1
                }
                console.log(newEf)
                await strapi.services['party'].update({ id }, { effectiveness_mod: newEf })
                break
            case "growth":
                let stat = newFocus.country_stat
                let currentMod = stat.mod
                let newMod = currentMod + newFocus.modifier / 100
                if (newMod > 2) {
                    newMod == 2
                }
                console.log(newMod)
                await strapi.services['country-stat'].update({ id: stat.id }, { mod: newMod })
                break
            case "identity":
                group = newFocus.population_attribute
                const blocks = await strapi.services.block.find({ demographics: group.id })
                blocks.map(async (block) => {
                    let party_support = await strapi.services["party-support"].find({ "block": block.id })
                    party_support = party_support.filter((p) => (p.party.id == entity.party.id))
                    party_support.map(async (p) => {
                      await strapi.services['party-support'].update({ id: p.id}, { "support": Math.ceil(p.support * 1.2)})
                    })
                })
                break
            case "issue":
                const law = await strapi.services.law.findOne({ id: newFocus.law.id })
                law.groups_for.map(async (group) => {
                    const blocks = await strapi.services.block.find({ demographics: group.id })
                    blocks.map(async (block) => {
                      let party_support = await strapi.services["party-support"].find({ "block": block.id })
                      party_support = party_support.filter((p) => (p.party.id == entity.party.id))
                      party_support.map(async (p) => {
                        await strapi.services['party-support'].update({ id: p.id}, { "support": Math.ceil(p.support * 1.1)})
                      })
                    })
                })
                law.groups_against.map(async (group) => {
                    const blocks = await strapi.services.block.find({ demographics: group.id })
                    blocks.map(async (block) => {
                      let party_support = await strapi.services["party-support"].find({ "block": block.id })
                      party_support = party_support.filter((p) => (p.party.id == entity.party.id))
                      party_support.map(async (p) => {
                        await strapi.services['party-support'].update({ id: p.id}, { "support": Math.ceil(p.support * 0.9)})
                      })
                    })
                })
        }
        switch (oldFocus.type) {
            case "efficiency":
                let currentEf = entity.effectiveness_mod
                let newEf = currentEf - oldFcous.modifier / 100
                console.log(newEf)
                await strapi.services['party'].update({ id }, { effectiveness_mod: newEf })
                break
            case "growth":
                let stat = oldFocus.country_stat
                let currentMod = stat.mod
                let newMod = currentMod - oldFocus.modifier / 100
                console.log(newMod)
                await strapi.services['country-stat'].update({ id: stat.id }, { mod: newMod })
                break
            case "identity":
                group = newFocus.population_attribute
                const blocks = await strapi.services.block.find({ demographics: group.id })
                blocks.map(async (block) => {
                    let party_support = await strapi.services["party-support"].find({ "block": block.id })
                    party_support = party_support.filter((p) => (p.party.id == entity.party.id))
                    party_support.map(async (p) => {
                      await strapi.services['party-support'].update({ id: p.id}, { "support": Math.ceil(p.support / 1.2)})
                    })
                })
                break
            case "issue":
                const law = await strapi.services.law.findOne({ id: newFocus.law.id })
                law.groups_for.map(async (group) => {
                    const blocks = await strapi.services.block.find({ demographics: group.id })
                    blocks.map(async (block) => {
                      let party_support = await strapi.services["party-support"].find({ "block": block.id })
                      party_support = party_support.filter((p) => (p.party.id == entity.party.id))
                      party_support.map(async (p) => {
                        await strapi.services['party-support'].update({ id: p.id}, { "support": Math.ceil(p.support / 1.1)})
                      })
                    })
                })
                law.groups_against.map(async (group) => {
                    const blocks = await strapi.services.block.find({ demographics: group.id })
                    blocks.map(async (block) => {
                      let party_support = await strapi.services["party-support"].find({ "block": block.id })
                      party_support = party_support.filter((p) => (p.party.id == entity.party.id))
                      party_support.map(async (p) => {
                        await strapi.services['party-support'].update({ id: p.id}, { "support": Math.ceil(p.support / 0.9)})
                      })
                    })
                })
        }
    }
    return sanitizeEntity(entity, { model: strapi.models.party });
  },
};

