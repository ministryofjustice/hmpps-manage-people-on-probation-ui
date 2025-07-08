describe('post create appointment request to real API', () => {
  it('Posts saved request body and expects 200', () => {
    cy.fixture('saved-request.json').then(body => {
      cy.request({
        method: 'POST',
        url: 'http://localhost:8100/appointment/X756510',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.eq(200)
      })
    })
  })
})
