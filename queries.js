const { gql } = require("graphql-request")

const hospitalFields = `
  id
  name
  icuAvailable
  hduAvailable                
  oxygenAvailable
  generalAvailable
  ventilatorsAvailable

  icuOccupied
  hduOccupied
  oxygenOccupied
  generalOccupied
  ventilatorsOccupied
  
  icuTotal
  hduTotal
  oxygenTotal
  generalTotal
  ventilatorsTotal
  address
  latitude
  longitude
  phone
  website
  city
  state
`

const searchGraphQLQuery = gql`
  query($city: String, $query: String) {
    locality(name: $city) {
      hospitals(first: 10, searchQuery: $query) {
        edges {
          node {
            ${hospitalFields}
          }
        }
      }
    }
  }
`

const hospitalGraphQLQuery = gql`
  query($id: ID!) {
    hospital(id: $id) {
      ${hospitalFields}
    }
  }
`

module.exports = {
  searchGraphQLQuery,
  hospitalGraphQLQuery,
}
