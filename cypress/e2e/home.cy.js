describe('template spec', () => {

  it('renders home on mobile', () => {
    cy.viewport(375, 667)
    cy.visit('http://localhost:8080')

    // Mobile header dropdown should be visible
    cy.get('header .d-sm-none .dropdown-toggle').should('be.visible')

    // Desktop navigation should be hidden on mobile
    cy.get('header nav.d-none.d-sm-flex').should('not.be.visible')

    // Toolbar should be visible
    cy.get('.toolbar').should('be.visible')

    // Wait for image cards to load and ensure at least one is rendered
    cy.get('.card', { timeout: 10000 }).its('length').should('be.gte', 1)
  })

  it('renders home on desktop', () => {
    cy.viewport(1280, 800)
    cy.visit('http://localhost:8080')

    // Desktop navigation should be visible
    cy.get('header nav.d-none.d-sm-flex').should('be.visible')

    // Mobile header dropdown should be hidden on desktop
    cy.get('header .d-sm-none').should('not.be.visible')

    // Toolbar should be visible
    cy.get('.toolbar').should('be.visible')

    // Ensure images render in grid
    cy.get('.card', { timeout: 10000 }).its('length').should('be.gte', 1)
  })

})