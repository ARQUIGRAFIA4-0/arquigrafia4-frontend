import Toolbar from './Toolbar.vue'

describe('<Toolbar />', () => {
  it('renders default textual mode and hides others', () => {
    cy.mount(Toolbar)

    cy.get('#search-input-textual').should('be.visible')
    cy.get('#search-input-avancada').should('not.be.visible')
    cy.get('#search-input-data').should('not.be.visible')
    cy.get('#search-input-cor').should('not.be.visible')
  })

  it('switches modes and updates active state', () => {
    cy.mount(Toolbar)

    const openDropdown = () => cy.get('#search-mode-dropdown').click()
    const clickItem = (label) => cy.contains('.dropdown-menu .dropdown-item', label).click()
    const assertActive = (label) => {
      openDropdown()
      cy.contains('.dropdown-menu .dropdown-item.active', label).should('exist')
      cy.get('#search-mode-dropdown').click()
    }

    // To Data
    openDropdown()
    clickItem('Busca por data')
    cy.get('#search-input-data').should('be.visible')
    cy.get('#search-input-textual').should('not.be.visible')
    assertActive('Busca por data')

    // To Color
    openDropdown()
    clickItem('Busca por cor')
    cy.get('#search-input-cor').should('be.visible')
    cy.get('#search-input-data').should('not.be.visible')
    assertActive('Busca por cor')

    // To Advanced
    openDropdown()
    clickItem('Busca avançada')
    cy.get('#search-input-avancada').should('be.visible')
    cy.get('#search-input-cor').should('not.be.visible')
    assertActive('Busca avançada')

    // Back to Textual
    openDropdown()
    clickItem('Busca textual')
    cy.get('#search-input-textual').should('be.visible')
    cy.get('#search-input-avancada').should('not.be.visible')
    assertActive('Busca textual')
  })

  it('emits confirm for textual mode', () => {
    const onConfirm = cy.stub().as('onConfirm')
    cy.mount(Toolbar, { props: { onConfirm } })

    cy.get('#search-input-textual input[type="text"]').type('casa')
    cy.get('#confirm-search').click()

    cy.get('@onConfirm').should('have.been.calledOnce')
    cy.get('@onConfirm').its('firstCall.args.0').should('deep.equal', {
      mode: 'textual',
      value: 'casa',
    })
  })

  it('emits null value when textual input is empty', () => {
    const onConfirm = cy.stub().as('onConfirm')
    cy.mount(Toolbar, { props: { onConfirm } })

    cy.get('#confirm-search').click()
    cy.get('@onConfirm').its('firstCall.args.0').should('deep.equal', {
      mode: 'textual',
      value: null,
    })
  })

  it('emits confirm for advanced mode', () => {
    const onConfirm = cy.stub().as('onConfirm')
    cy.mount(Toolbar, { props: { onConfirm } })

    cy.get('#search-mode-dropdown').click()
    cy.contains('.dropdown-menu .dropdown-item', 'Busca avançada').click()
    cy.get('#confirm-search').click()

    cy.get('@onConfirm').its('firstCall.args.0').should('deep.equal', {
      mode: 'avancada',
      value: null,
    })
  })

  it('emits confirm for date mode', () => {
    const onConfirm = cy.stub().as('onConfirm')
    cy.mount(Toolbar, { props: { onConfirm } })

    cy.get('#search-mode-dropdown').click()
    cy.contains('.dropdown-menu .dropdown-item', 'Busca por data').click()
    cy.get('#search-input-data input[type="date"]').eq(0).type('2023-01-01')
    cy.get('#search-input-data input[type="date"]').eq(1).type('2023-12-31')
    cy.get('#confirm-search').click()

    cy.get('@onConfirm').its('firstCall.args.0').should('deep.equal', {
      mode: 'data',
      value: { start: '2023-01-01', end: '2023-12-31' },
    })
  })

  it('emits confirm for color mode', () => {
    const onConfirm = cy.stub().as('onConfirm')
    cy.mount(Toolbar, { props: { onConfirm } })

    cy.get('#search-mode-dropdown').click()
    cy.contains('.dropdown-menu .dropdown-item', 'Busca por cor').click()
    cy.get('#search-input-cor input[type="range"]').invoke('val', 0).trigger('input')
    cy.get('#confirm-search').click()

    cy.get('@onConfirm').its('firstCall.args.0').should('deep.equal', {
      mode: 'cor',
      value: '#ff0000',
    })
  })

  it('emits view-change for all view options', () => {
    const onViewChange = cy.stub().as('onViewChange')
    cy.mount(Toolbar, { props: { onViewChange } })

    const openViewDropdown = () => cy.get('#view-mode-dropdown').click()
    const clickViewItem = (label) => cy.contains('.dropdown-menu .dropdown-item', label).click()

    // Mar de imagens -> grid
    openViewDropdown()
    clickViewItem('Mar de imagens')
    cy.get('@onViewChange').should('have.been.calledWith', 'grid')

    // Mapa -> map
    openViewDropdown()
    clickViewItem('Mapa')
    cy.get('@onViewChange').should('have.been.calledWith', 'map')

    // Grade -> grid
    openViewDropdown()
    clickViewItem('Grade')
    cy.get('@onViewChange').should('have.been.calledWith', 'grid')

    // Mosaico -> mosaic
    openViewDropdown()
    clickViewItem('Mosaico')
    cy.get('@onViewChange').should('have.been.calledWith', 'mosaic')

    // Ensure total calls count
    cy.get('@onViewChange').should('have.callCount', 4)
  })
})