module.exports = {
  routes: [
    { // Path defined with an URL parameter
      method: 'GET',
      path: '/get_results',
      handler: 'population-attribute.getResults',
    }
  ]
}