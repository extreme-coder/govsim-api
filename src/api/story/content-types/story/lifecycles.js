module.exports = {
  async afterCreate(event) {
    const s = await strapi.entityService.findOne('api::story.story', event.result.id, {populate: {country: true, party: true}})
    strapi.io.to(s.country.id).emit('new_story', s)
    console.log('message emitted')
  },
}