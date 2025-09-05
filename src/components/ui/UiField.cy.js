import { h } from 'vue'
import UiField from './UiField.vue'

describe('<UiField />', () => {
  it('renderiza corretamente no mobile (iPhone 6)', () => {
    cy.mountWithViewport(UiField, {
      props: { label: 'Nome' },
      slots: {
        default: '<input class="form-control" type="text" placeholder="Digite seu nome" />'
      }
    }, 'iphone-6')

    cy.get('label').should('be.visible')
    cy.get('input').should('be.visible')
  })

  it('exibe label e suporta placeholder no conteúdo do slot', () => {
    cy.mount(UiField, {
      props: { label: 'Nome' },
      slots: {
        default: '<input class="form-control" placeholder="Digite seu nome" />'
      }
    })

    cy.contains('label', 'Nome').should('exist')
    cy.get('input').should('have.attr', 'placeholder', 'Digite seu nome')
  })

  it('não renderiza o ícone de ajuda quando a prop explain está ausente', () => {
    cy.mount(UiField, {
      props: { label: 'Nome' },
      slots: { default: '<input class="form-control" />' }
    })

    cy.get('[data-cy="explain-icon"]').should('not.exist')
  })

  it('renderiza o ícone de ajuda e mostra o popover ao focar', () => {
    const message = 'Ajuda sobre este campo'
    cy.mount(UiField, {
      props: { label: 'Nome', explain: message },
      slots: { default: '<input class="form-control" />' }
    })

    cy.get('[data-cy="explain-icon"]').should('exist').focus()
    cy.get('body').find('.popover').should('be.visible').and('contain.text', message)
    cy.get('[data-cy="explain-icon"]').blur()
    cy.get('body').find('.popover').should('not.exist')
  })

  it('aplica o estado inválido e exibe a mensagem de feedback com A11y', () => {
    cy.mount(UiField, {
      props: { id: 'first-name', invalid: true, invalidMessage: 'Campo obrigatório' },
      slots: {
        default: (slotProps) => h('input', {
          id: slotProps.id,
          class: 'form-control',
          'aria-invalid': slotProps.ariaInvalid,
          'aria-describedby': slotProps.ariaDescribedby,
        })
      }
    })

    cy.get('.invalid-feedback').should('contain.text', 'Campo obrigatório').and('be.visible')
    cy.get('input').should('have.attr', 'aria-invalid', 'true')
    cy.get('input').should('have.attr', 'aria-describedby', 'first-name-error')
    cy.get('.invalid-feedback').should('have.attr', 'id', 'first-name-error')
  })

  it('permite passar qualquer markup no slot padrão (ex.: input-group)', () => {
    cy.mount(UiField, {
      props: { label: 'Título do campo', explain: 'Ajuda sobre este campo' },
      slots: {
        default: `
          <div class="input-group input-group-sm">
            <button class="btn btn-primary dropdown-toggle bg-azul-e border-azul-e fw-normal" type="button" data-bs-toggle="dropdown" aria-expanded="false">Dropdown</button>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#">Action</a></li>
              <li><a class="dropdown-item" href="#">Another action</a></li>
              <li><a class="dropdown-item" href="#">Something else here</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#">Separated link</a></li>
            </ul>
            <input class="form-control border-azul-e border-end-0" />
            <button class="btn btn-light btn-sm border-azul-e border-start-0 bg-transparent" type="button" aria-label="Buscar">
              <i class="bi bi-plus-square-fill fs-6"></i>
            </button>
          </div>
        `
      }
    })

    cy.get('.input-group').should('exist')
    cy.get('.dropdown-toggle').click()
    cy.get('.dropdown-menu').should('be.visible')
  
  })
})