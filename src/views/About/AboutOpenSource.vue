<template>
  <AboutLayout>
    <div class="col-12 col-md-8">
      <h1 class="about-open__title">Código aberto e API</h1>
    </div>
    <div class="col-12 col-md-8">
      <h2 class="about-open__subtitle">
        O ARQUIGRAFIA é um projeto de código aberto. Todos estão convidados a estudar o código, sugerir melhorias,
        rodar a plataforma localmente ou usar a API para consultar o acervo de imagens de arquitetura.
      </h2>

      <!-- Repositórios -->
      <h3 class="about-open__subtitle about-open__subtitle--rules">Onde está o código</h3>
      <p class="about-open__paragraph">
        O projeto é dividido em repositórios independentes. Cada um tem seu próprio README com instruções
        específicas.
      </p>
      <ul class="about-open__repos">
        <li v-for="repo in repositories" :key="repo.name" class="about-open__repo">
          <a :href="repo.url" target="_blank" rel="noopener noreferrer" class="about-open__repo-name">
            {{ repo.name }}
          </a>
          <span class="about-open__repo-stack">{{ repo.stack }}</span>
          <p class="about-open__repo-desc">{{ repo.description }}</p>
        </li>
      </ul>

      <!-- Licenças -->
      <h3 class="about-open__subtitle about-open__subtitle--rules">Licença do código e licença das imagens</h3>
      <p class="about-open__paragraph">
        São duas coisas diferentes. O <strong>código-fonte</strong> da plataforma é software livre, 
        distribuído sob os termos da Licença Pública Geral GNU (GPLv3 ou posterior). 
        Já cada <strong>imagem</strong> do acervo tem a licença Creative Commons 
        escolhida por quem a enviou. Ao reutilizar uma imagem obtida pela API, 
        respeite a licença dela e cite a autoria.
      </p>

      <!-- Acesso à API -->
      <h3 class="about-open__subtitle about-open__subtitle--rules">Como acessar a API</h3>
      <p class="about-open__paragraph">
        Todas as requisições partem do endereço base:
      </p>
      <pre class="about-open__block"><code>{{ apiBaseUrl }}</code></pre>
      <p class="about-open__paragraph">
        <strong>Leitura:</strong> consultas ao acervo são públicas e não exigem autenticação.
      </p>
      <p class="about-open__paragraph">
        <strong>Escrita:</strong> enviar imagens, comentar ou avaliar exige um token de acesso, enviado no cabeçalho
        <code class="about-open__code">Authorization: Bearer SEU_TOKEN</code>. Você gera o token nas configurações
        da sua conta.
      </p>
      <p class="about-open__paragraph">
        <strong>Limites:</strong> para manter o serviço estável, cada endereço IP pode fazer até
        {{ rateLimit }}. Acima disso, a API responde com o código
        <code class="about-open__code">429</code>.
      </p>

      <!-- Endpoints -->
      <h3 class="about-open__subtitle about-open__subtitle--rules">Principais endpoints</h3>
      <div class="about-open__table-wrapper">
        <table class="about-open__table">
          <thead>
            <tr>
              <th scope="col">Método</th>
              <th scope="col">Rota</th>
              <th scope="col">O que faz</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="endpoint in endpoints" :key="endpoint.method + endpoint.path">
              <td>
                <span class="about-open__method" :class="`about-open__method--${endpoint.method.toLowerCase()}`">
                  {{ endpoint.method }}
                </span>
              </td>
              <td><code class="about-open__code">{{ endpoint.path }}</code></td>
              <td>{{ endpoint.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="about-open__paragraph about-open__paragraph--note">
        Para ver essas e outras rotas detalhadamente acesse a
        <a href="https://api.arquigrafia.org.br/docs#introduction" target="_blank" rel="noopener noreferrer" class="about-open__repo-name">
          documentação da API
        </a>
      </p>

      <!-- Contribuir -->
      <h3 class="about-open__subtitle about-open__subtitle--rules">Como contribuir</h3>
      <p class="about-open__paragraph">
        <strong>Encontrou um erro?</strong> Abra uma issue no repositório correspondente descrevendo o que
        aconteceu, o que você esperava e, se possível, como reproduzir o problema.
      </p>
      <p class="about-open__paragraph">
        <strong>Quer propor uma mudança?</strong> Faça um fork, crie um branch a partir de
        <code class="about-open__code">develop</code> e envie um pull request explicando o que foi alterado. Mudanças
        grandes merecem uma issue antes, para discutir a abordagem.
      </p>
      <p class="about-open__paragraph">
        <strong>Não programa?</strong> Também dá para ajudar revisando textos, testando novas versões, melhorando a
        documentação ou sugerindo funcionalidades.
      </p>

      <!-- Uso responsável -->
      <h3 class="about-open__subtitle about-open__subtitle--rules">Uso responsável</h3>
      <p class="about-open__paragraph">
        Aplicações que usam a API devem seguir as Políticas do ARQUIGRAFIA, respeitar a licença de cada imagem,
        creditar autores e não coletar dados pessoais de usuários. Projetos acadêmicos e de pesquisa são muito
        bem-vindos: se o seu usar o acervo, conte para nós.
      </p>
      <p class="about-open__paragraph">
        Dúvidas técnicas podem ser enviadas para
        <a :href="`mailto:${contactEmail}`" class="about-open__link">{{ contactEmail }}</a>.
      </p>
    </div>
  </AboutLayout>
</template>

<script>
import AboutLayout from "./AboutLayout.vue";

export default {
  name: "AboutOpenSource",
  components: {
    AboutLayout,
  },
  data() {
    const apiBaseUrl = "https://api.arquigrafia.org.br/";

    return {
      apiBaseUrl,
      rateLimit: "60 requisições por minuto",
      contactEmail: "arquigrafia.org.br",

      repositories: [
        {
          name: "arquigrafia-frontend",
          stack: "Vue.js",
          url: "https://github.com/ARQUIGRAFIA4-0/arquigrafia4-frontend/tree/develop",
          description: "Interface web: páginas, busca, visualização e envio de imagens.",
        },
        {
          name: "arquigrafia-backend",
          stack: "PHP / MySQL",
          url: "https://github.com/ARQUIGRAFIA4-0/arquigrafia4-backend/tree/develop",
          description: "API, regras de negócio, busca textual e armazenamento do acervo.",
        },
      ],

      endpoints: [
        { method: "GET", path: "/api/images", description: "Lista imagens, com filtros e paginação." },
        { method: "GET", path: "/api/images/{id}", description: "Detalhes de uma imagem: autoria, data, licença." },
        { method: "GET", path: "/api/users/{id}", description: "Perfil público de um usuário." },
        { method: "POST", path: "/api/images", description: "Envia uma nova imagem (exige token)." },
        { method: "POST", path: "/api/comments", description: "Comenta uma imagem (exige token)." },
      ],

      activeExample: "curl",
      copied: false,
      examples: [
        {
          id: "curl",
          label: "cURL",
          code: `curl "${apiBaseUrl}/images?q=rio&year=1950&license=CC-BY&page=1"`,
        },
        {
          id: "js",
          label: "JavaScript",
          code: [
            "const params = new URLSearchParams({",
            '  q: "rio",',
            '  year: "1950",',
            '  license: "CC-BY",',
            "});",
            "",
            `const response = await fetch(\`${apiBaseUrl}/images?\${params}\`);`,
            "const { data } = await response.json();",
          ].join("\n"),
        },
        {
          id: "python",
          label: "Python",
          code: [
            "import requests",
            "",
            "response = requests.get(",
            `    "${apiBaseUrl}/images",`,
            '    params={"q": "rio", "year": 1950, "license": "CC-BY"},',
            ")",
            'imagens = response.json()["data"]',
          ].join("\n"),
        },
      ],

      exampleResponse: [
        "{",
        '  "data": [',
        "    {",
        '      "id": 1234,',
        '      "title": "Edifício no Rio de Janeiro",',
        '      "author": "Nome do autor",',
        '      "year": 1950,',
        '      "license": "CC BY",',
        '      "image_url": ".../images/1234.jpg"',
        "    }",
        "  ],",
        '  "meta": { "page": 1, "per_page": 20, "total": 87 }',
        "}",
      ].join("\n"),

      setupSteps: [
        {
          title: "Clone o repositório",
          description: "Baixe o código para o seu computador.",
          command: "git clone https://github.com/SEU-ORG/arquigrafia-frontend.git\ncd arquigrafia-frontend",
        },
        {
          title: "Instale as dependências",
          description: "É necessário ter o Node.js instalado.",
          command: "npm install",
        },
        {
          title: "Configure o ambiente",
          description: "Copie o arquivo de exemplo e ajuste o endereço da API.",
          command: "cp .env.example .env",
        },
        {
          title: "Inicie o servidor de desenvolvimento",
          description: "A plataforma abrirá no navegador, no endereço indicado no terminal.",
          command: "npm run dev",
        },
      ],
    };
  },
  computed: {
    currentExample() {
      return this.examples.find((example) => example.id === this.activeExample);
    },
  },
  methods: {
    async copyExample() {
      try {
        await navigator.clipboard.writeText(this.currentExample.code);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      } catch (error) {
        console.error("Não foi possível copiar:", error);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;
$mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
$code-bg: #f2f2f2;
$line: #d9d9d9;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.about-open {
  &__title {
    width: fit-content;
    font-weight: 600;
    font-size: 20px;
    line-height: 150%;
    border-bottom: 2px solid #000000;
    padding-bottom: 16px;
    margin-bottom: 24px;

    @include md {
      font-size: 30px;
      margin-bottom: 55px;
      border-bottom: 4px solid #000000;
      padding-bottom: 20px;
    }
  }

  &__subtitle {
    font-weight: 500;
    font-size: 16px;
    line-height: 150%;
    margin-bottom: 24px;

    @include md {
      font-size: 20px;
      margin-bottom: 32px;
      padding-right: 120px;
    }

    &--rules {
      font-weight: 600;
      margin-top: 32px;
      margin-bottom: 12px;

      @include md {
        font-size: 18px;
        margin-top: 64px;
        margin-bottom: 24px;
      }
    }
  }

  // Recuo do conteúdo das seções, igual ao das outras páginas Sobre
  &__paragraph,
  &__repos,
  &__block,
  &__block-wrapper,
  &__table-wrapper,
  &__tabs,
  &__steps {
    @include md {
      margin-left: 120px;
    }
  }

  // Blocos dentro de wrappers/passos não recebem recuo duplo
  &__block-wrapper &__block,
  &__step &__block {
    margin-left: 0;
  }

  &__paragraph {
    font-weight: 400;
    font-size: 14px;
    line-height: 125%;

    @include md {
      font-weight: 500;
      font-size: 16px;
      line-height: 150%;
    }

    &--note {
      border-left: 2px solid #000000;
      padding-left: 12px;
      margin-top: 16px;
    }
  }

  &__link {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;

    &:focus-visible {
      outline: 2px solid #000000;
      outline-offset: 2px;
    }
  }

  // Repositórios
  &__repos {
    list-style: none;
    padding: 0;
    margin-bottom: 16px;
  }

  &__repo {
    border-top: 1px solid $line;
    padding: 16px 0;

    &:last-child {
      border-bottom: 1px solid $line;
    }
  }

  &__repo-name {
    font-family: $mono;
    font-weight: 600;
    font-size: 15px;
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    margin-right: 12px;

    &:focus-visible {
      outline: 2px solid #000000;
      outline-offset: 2px;
    }
  }

  &__repo-stack {
    font-size: 13px;
    border: 1px solid #000000;
    padding: 1px 8px;
    white-space: nowrap;
  }

  &__repo-desc {
    font-size: 14px;
    line-height: 150%;
    margin: 8px 0 0;

    @include md {
      font-size: 16px;
    }
  }

  // Código
  &__code {
    font-family: $mono;
    font-size: 0.9em;
    background-color: $code-bg;
    padding: 1px 6px;
    border-radius: 3px;
    word-break: break-word;
  }

  &__block {
    font-family: $mono;
    font-size: 13px;
    line-height: 150%;
    background-color: $code-bg;
    border-left: 3px solid #000000;
    padding: 12px 16px;
    margin-bottom: 16px;
    overflow-x: auto;
    white-space: pre;

    @include md {
      font-size: 14px;
      padding: 16px 20px;
    }

    &--tabbed {
      padding-right: 88px;
    }
  }

  &__block-wrapper {
    position: relative;
  }

  &__copy {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 13px;
    background: #ffffff;
    border: 1px solid #000000;
    padding: 4px 10px;
    cursor: pointer;

    &:hover {
      background: #000000;
      color: #ffffff;
    }

    &:focus-visible {
      outline: 2px solid #000000;
      outline-offset: 2px;
    }
  }

  // Abas dos exemplos
  &__tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 0;
  }

  &__tab {
    font-size: 14px;
    background: transparent;
    border: 1px solid transparent;
    border-bottom: none;
    padding: 6px 14px;
    cursor: pointer;

    &--active {
      background: $code-bg;
      font-weight: 600;
    }

    &:focus-visible {
      outline: 2px solid #000000;
      outline-offset: -2px;
    }
  }

  // Tabela de endpoints
  &__table-wrapper {
    overflow-x: auto;
    margin-bottom: 16px;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    line-height: 150%;

    @include md {
      font-size: 16px;
    }

    th,
    td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid $line;
      vertical-align: top;
    }

    th {
      font-weight: 600;
      border-bottom: 2px solid #000000;
    }

    td:nth-child(2) {
      white-space: nowrap;
    }
  }

  &__method {
    display: inline-block;
    font-family: $mono;
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border: 1px solid #000000;

    &--post {
      background: #000000;
      color: #ffffff;
    }
  }

  // Passos de instalação
  &__steps {
    padding-left: 20px;
    margin-bottom: 16px;
  }

  &__step {
    font-size: 14px;
    line-height: 150%;
    margin-bottom: 20px;

    @include md {
      font-size: 16px;
    }
  }

  &__step-desc {
    margin: 4px 0 8px;
  }
}
</style>