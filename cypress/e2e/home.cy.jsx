describe('Página inicial', () => {
  const visitHome = () => {
    cy.visit('http://localhost:8080')
    cy.url({ timeout: 10000 }).should('include', '/explore')
  }

  const ensureMosaicView = () => {
    cy.get('[data-cy="view-mosaic"] .mosaic-card', { timeout: 10000 })
      .its('length')
      .should('be.gte', 1)
  }

  const ensureGridView = () => {
    cy.get('[data-cy="view-grid"]', { timeout: 10000 }).should('exist')
    cy.get('[data-cy="view-grid"] .view-grid__card', { timeout: 10000 })
      .its('length')
      .should('be.gte', 1)
  }

  const ensureMapView = () => {
    cy.get('[data-cy="view-map"] .map-wrap', { timeout: 10000 })
      .should('exist')
  }

  const openViewMenu = () => {
    cy.get('[data-cy="toolbar-desktop"] #view-mode-dropdown')
      .click({ force: true })
  }

  const selectViewOption = (label) => {
    cy.contains('[data-cy="toolbar-desktop"] .dropdown-menu.show .dropdown-item', label)
      .click({ force: true })
  }

  const openSearchModeMenu = () => {
    cy.get('[data-cy="toolbar-desktop"] #search-mode-dropdown')
      .click({ force: true })
  }

  const selectSearchMode = (label) => {
    cy.contains('[data-cy="toolbar-desktop"] .dropdown-menu.show .dropdown-item', label)
      .click({ force: true })
  }

  const openMobileTextDrawer = () => {
    cy.get('[data-cy="toolbar-mobile"] #search-text-button')
      .click({ force: true })
    cy.get('#drawer-search-text').should('have.class', 'show')
  }

  const openMobileColorDrawer = () => {
    cy.get('[data-cy="toolbar-mobile"] #search-color-button')
      .click({ force: true })
    cy.get('#drawer-search-color').should('have.class', 'show')
  }

  const openMobileDateDrawer = () => {
    cy.get('[data-cy="toolbar-mobile"] #search-date-button')
      .click({ force: true })
    cy.get('#drawer-search-date').should('have.class', 'show')
  }

  it('exibe navegação responsiva no mobile', () => {
    cy.viewport(375, 667)
    visitHome()

    cy.get('header .mobile-nav__link').its('length').should('be.gte', 1)

    cy.get('[data-cy="toolbar"]').should('exist')
    cy.get('[data-cy="toolbar-mobile"]').should('exist')
    cy.get('[data-cy="toolbar-desktop"]').should('not.exist')

    ensureMosaicView()
  })

  it('exibe layout desktop com toolbar', () => {
    cy.viewport(1280, 800)
    visitHome()

    cy.get('header nav.d-none.d-sm-flex').should('exist')

    cy.get('[data-cy="toolbar"]').should('exist')
    cy.get('[data-cy="toolbar-desktop"]').should('exist')
    cy.get('[data-cy="toolbar-mobile"]').should('not.exist')

    ensureMosaicView()
  })

  it('permite trocar para visualização em grade', () => {
    cy.viewport(1280, 800)
    visitHome()

    ensureMosaicView()

    openViewMenu()
    selectViewOption('Grade')

    cy.url({ timeout: 10000 }).should('include', '/explore/acervo/grid')
    ensureGridView()
    cy.get('[data-cy="view-mosaic"]').should('not.exist')
  })

  it('permite trocar para visualização no mapa', () => {
    cy.viewport(1280, 800)
    visitHome()

    ensureMosaicView()

    openViewMenu()
    selectViewOption('Mapa')

    cy.url({ timeout: 10000 }).should('include', '/explore/acervo/map')
    ensureMapView()
    cy.get('[data-cy="view-mosaic"]').should('not.exist')
  })

  it('realiza busca textual e atualiza a URL no desktop', () => {
    cy.viewport(1280, 800)
    visitHome()

    const query = 'TermoTeste'

    cy.get('#search-input-textual input')
      .clear()
      .type(query)
    cy.get('#confirm-search').click()

    cy.url({ timeout: 10000 }).should('include', 'searchMode=textual')
    cy.url().should('include', `q=${encodeURIComponent(query)}`)
    ensureMosaicView()
  })

  it('realiza busca por cor e atualiza a URL no desktop', () => {
    cy.viewport(1280, 800)
    visitHome()

    openSearchModeMenu()
    selectSearchMode('Busca por cor')

    cy.get('#search-input-cor').should('be.visible')
    cy.get('#search-input-cor input[type="range"]')
      .invoke('val', 180)
      .trigger('input')

    cy.get('#confirm-search').click()

    cy.url({ timeout: 10000 }).should('include', 'searchMode=cor')
    cy.url().should('match', /color=%23[0-9a-fA-F]{6}/)
    ensureMosaicView()
  })

  it('realiza busca por data e atualiza a URL no desktop', () => {
    cy.viewport(1280, 800)
    visitHome()

    openSearchModeMenu()
    selectSearchMode('Busca por data')

    const start = '2020-01-01'
    const end = '2021-12-31'

    cy.get('#search-input-data input[type="date"]').first().clear().type(start)
    cy.get('#search-input-data input[type="date"]').last().clear().type(end)

    cy.get('#confirm-search').click()

    cy.url({ timeout: 10000 }).should('include', 'searchMode=data')
    cy.url().should('include', `dateStart=${start}`)
    cy.url().should('include', `dateEnd=${end}`)
    ensureMosaicView()
  })

  it('realiza busca avançada com tags e atualiza a URL no desktop', () => {
    cy.viewport(1280, 800)
    visitHome()

    openSearchModeMenu()
    selectSearchMode('Busca avançada')

    cy.get('.modal-panel').should('exist')
    cy.contains('.modal-panel button', 'Concreto').click({ force: true })
    cy.contains('.modal-footer button', 'Buscar').click({ force: true })

    cy.url({ timeout: 10000 }).should('include', 'searchMode=avancada')
    cy.url().should('include', 'tag=Concreto')
    ensureMosaicView()
  })

  it('realiza busca avançada por termo no mobile e atualiza a URL', () => {
    cy.viewport(375, 667)
    visitHome()

    openMobileTextDrawer()

    const query = 'TermoMobile'

    cy.get('#drawer-search-text input[placeholder="Digite o termo de busca"]')
      .clear()
      .type(query)
    cy.get('#drawer-search-text button[aria-label="Buscar"]').click()
    cy.contains('#drawer-search-text .btn-tag', query).should('exist')
    cy.contains('#drawer-search-text button', 'Buscar').click({ force: true })

    cy.url({ timeout: 10000 }).should('include', 'searchMode=avancada')
    cy.url().should('include', `q=${encodeURIComponent(query)}`)
    ensureMosaicView()
  })

  it('realiza busca por cor no mobile e atualiza a URL', () => {
    cy.viewport(375, 667)
    visitHome()

    openMobileColorDrawer()

    cy.get('#drawer-search-color .swatch').first().click({ force: true })
    cy.contains('#drawer-search-color button', 'Buscar').click({ force: true })

    cy.url({ timeout: 10000 }).should('include', 'searchMode=cor')
    cy.url().should('match', /color=%23[0-9a-fA-F]{6}/)
    ensureMosaicView()
  })

  it('realiza busca por data no mobile e atualiza a URL', () => {
    cy.viewport(375, 667)
    visitHome()

    openMobileDateDrawer()

    const start = '2015-01-01'
    const end = '2018-12-31'

    cy.get('#drawer-search-date input[type="date"]').first().clear().type(start)
    cy.get('#drawer-search-date input[type="date"]').last().clear().type(end)
    cy.contains('#drawer-search-date button', 'Buscar').click({ force: true })

    cy.url({ timeout: 10000 }).should('include', 'searchMode=data')
    cy.url().should('include', `dateStart=${start}`)
    cy.url().should('include', `dateEnd=${end}`)
    ensureMosaicView()
  })

  it('realiza busca avançada por tags no mobile e atualiza a URL', () => {
    cy.viewport(375, 667)
    visitHome()

    openMobileTextDrawer()

    cy.contains('#drawer-search-text button', 'Concreto').click({ force: true })
    cy.contains('#drawer-search-text button', 'Buscar').click({ force: true })

    cy.url({ timeout: 10000 }).should('include', 'searchMode=avancada')
    cy.url().should('include', 'tag=Concreto')
    ensureMosaicView()
  })
})

