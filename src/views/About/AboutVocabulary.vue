<template>
  <AboutLayout>
    <div class="col-12 col-md-8">
      <h1 class="about-vocabulary__title">O vocabulário do ARQUIGRAFIA</h1>
    </div>
    <div class="col-12 col-md-8">
      <h2 class="about-vocabulary__subtitle">
        As <i>tags</i> atribuídas pelos usuários no momento do <i>upload</i> das imagens na plataforma ARQUIGRAFIA são utilizadas como termos candidatos para o “Vocabulário Colaborativo em Artes e Arquitetura” (VCAA).
      </h2>
      <p class="about-vocabulary__paragraph">
        O VCAA é fruto do consórcio de mesmo nome criado em 2016 com a participação das bibliotecas da ECA USP e da FAU USP e da Pinacoteca do Estado de São Paulo, ao qual o ARQUIGRAFIA vem se unir em 2019. Coordenado por Vânia Lima, professora no <a href="https://www3.eca.usp.br/o-que-e-dic/" target="_blank" rel="noopener">Departamento de Informação e Cultura</a> da ECA USP, o VCAA tornou-se o referente para o vocabulário do ARQUIGRAFIA e também contribui, com os termos em língua portuguesa, com o <a href="https://www.getty.edu/research/tools/vocabularies/aat/" target="_blank" rel="noopener">Art &amp; Architecture Thesaurus</a> do Getty Research Institute.
      </p>
      <p class="about-vocabulary__paragraph">
        O VCAA tem um crescimento contínuo de termos e sua manutenção é feita de forma gradual. Sua equipe é composta por profissionais, professores, pesquisadores e estudantes das áreas de Biblioteconomia e Ciência da Informação, parte deles integrantes do ARQUIGRAFIA. É uma ferramenta gratuita para apoiar a descrição informacional de coleções artísticas e arquitetônicas.
      </p>

      <a class="about-vocabulary__button" href="https://www.vcaa.fau.usp.br/" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M5.5685 11.8125C5.5685 11.9285 5.61459 12.0398 5.69664 12.1219C5.77869 12.2039 5.88997 12.25 6.006 12.25H11.8125C12.1606 12.25 12.4944 12.1117 12.7406 11.8656C12.9867 11.6194 13.125 11.2856 13.125 10.9375V2.1875C13.125 1.8394 12.9867 1.50556 12.7406 1.25942C12.4944 1.01328 12.1606 0.875 11.8125 0.875H3.0625C2.7144 0.875 2.38056 1.01328 2.13442 1.25942C1.88828 1.50556 1.75 1.8394 1.75 2.1875V7.994C1.75 8.11003 1.79609 8.22131 1.87814 8.30336C1.96019 8.38541 2.07147 8.4315 2.1875 8.4315C2.30353 8.4315 2.41481 8.38541 2.49686 8.30336C2.57891 8.22131 2.625 8.11003 2.625 7.994V2.1875C2.625 2.07147 2.67109 1.96019 2.75314 1.87814C2.83519 1.79609 2.94647 1.75 3.0625 1.75H11.8125C11.9285 1.75 12.0398 1.79609 12.1219 1.87814C12.2039 1.96019 12.25 2.07147 12.25 2.1875V10.9375C12.25 11.0535 12.2039 11.1648 12.1219 11.2469C12.0398 11.3289 11.9285 11.375 11.8125 11.375H6.006C5.88997 11.375 5.77869 11.4211 5.69664 11.5031C5.61459 11.5852 5.5685 11.6965 5.5685 11.8125Z" fill="white"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M9.62555 4.8125C9.62555 4.69647 9.57946 4.58519 9.49741 4.50314C9.41536 4.42109 9.30408 4.375 9.18805 4.375H4.81305C4.69702 4.375 4.58574 4.42109 4.50369 4.50314C4.42165 4.58519 4.37555 4.69647 4.37555 4.8125C4.37555 4.92853 4.42165 5.03981 4.50369 5.12186C4.58574 5.20391 4.69702 5.25 4.81305 5.25H8.13193L1.0033 12.3777C0.921152 12.4599 0.875 12.5713 0.875 12.6875C0.875 12.8037 0.921152 12.9151 1.0033 12.9973C1.08545 13.0794 1.19687 13.1256 1.31305 13.1256C1.42923 13.1256 1.54065 13.0794 1.6228 12.9973L8.75055 5.86862V9.1875C8.75055 9.30353 8.79665 9.41481 8.87869 9.49686C8.96074 9.57891 9.07202 9.625 9.18805 9.625C9.30408 9.625 9.41536 9.57891 9.49741 9.49686C9.57946 9.41481 9.62555 9.30353 9.62555 9.1875V4.8125Z" fill="white"/>
        </svg>
        Conheça o VCAA
      </a>

      <p class="about-vocabulary__paragraph">
        Enquanto as tags dos usuários trazem uma diversidade de palavras para a descrição das imagens, o VCAA busca padronizá-las para evitar ambiguidades, por exemplo, no uso de sinônimos e homógrafos (palavras com a mesma grafia, mas com sentido diferentes). A padronização envolve a elaboração de definições-síntese, a estruturação em hierarquias e o estabelecimento de relacionamentos entre os termos.
      </p>

      <p class="about-vocabulary__paragraph">
        O VCAA está disponível online e pode ser utilizado por instituições e projetos interessados nas temáticas de arquitetura e artes.
      </p>

      <section class="about-vocabulary__accordion" aria-label="Informações sobre o VCAA">
        <article class="about-vocabulary__accordion-item">
          <button
            type="button"
            class="about-vocabulary__accordion-trigger"
            :aria-expanded="String(activeSection === 'include-tags')"
            aria-controls="include-tags"
            @click="toggleSection('include-tags')"
          >
            <span>Como incluir <i>tags</i> nas imagens</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              class="about-vocabulary__accordion-icon"
              :class="{ 'about-vocabulary__accordion-icon--open': activeSection === 'include-tags' }"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M2.46839 6.96888C2.53806 6.89903 2.62082 6.84362 2.71194 6.80581C2.80305 6.768 2.90074 6.74854 2.99939 6.74854C3.09804 6.74854 3.19572 6.768 3.28684 6.80581C3.37796 6.84362 3.46072 6.89903 3.53039 6.96888L11.9994 15.4394L20.4684 6.96888C20.5381 6.89914 20.6209 6.84383 20.712 6.80609C20.8031 6.76835 20.9008 6.74893 20.9994 6.74893C21.098 6.74893 21.1957 6.76835 21.2868 6.80609C21.3779 6.84383 21.4607 6.89914 21.5304 6.96888C21.6001 7.03861 21.6554 7.12139 21.6932 7.2125C21.7309 7.30361 21.7503 7.40126 21.7503 7.49988C21.7503 7.59849 21.7309 7.69614 21.6932 7.78725C21.6554 7.87836 21.6001 7.96114 21.5304 8.03088L12.5304 17.0309C12.4607 17.1007 12.378 17.1561 12.2868 17.1939C12.1957 17.2318 12.098 17.2512 11.9994 17.2512C11.9007 17.2512 11.8031 17.2318 11.7119 17.1939C11.6208 17.1561 11.5381 17.1007 11.4684 17.0309L2.46839 8.03088C2.39854 7.96121 2.34313 7.87844 2.30532 7.78733C2.26751 7.69621 2.24805 7.59853 2.24805 7.49988C2.24805 7.40122 2.26751 7.30354 2.30532 7.21243C2.34313 7.12131 2.39854 7.03854 2.46839 6.96888Z"
                fill="#636262"
              />
            </svg>
          </button>

          <div
            v-show="activeSection === 'include-tags'"
            id="include-tags"
            class="about-vocabulary__accordion-content"
          >

            <p class="about-vocabulary__accordion-paragraph">
              Ao fazer upload de imagens no ARQUIGRAFIA, no campo “Tags da imagem” você pode atribuir palavras novas, selecionar palavras sugeridas ao iniciar a digitação (conforme imagem ilustrativa abaixo) ou incluir termos que você encontrou no VCAA.
            </p>
        
          </div>
        </article>

        <article class="about-vocabulary__accordion-item">
          <button
            type="button"
            class="about-vocabulary__accordion-trigger"
            :aria-expanded="String(activeSection === 'use-vcaa')"
            aria-controls="use-vcaa"
            @click="toggleSection('use-vcaa')"
          >
            <span>Como usar o VCAA</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              class="about-vocabulary__accordion-icon"
              :class="{ 'about-vocabulary__accordion-icon--open': activeSection === 'use-vcaa' }"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M2.46839 6.96888C2.53806 6.89903 2.62082 6.84362 2.71194 6.80581C2.80305 6.768 2.90074 6.74854 2.99939 6.74854C3.09804 6.74854 3.19572 6.768 3.28684 6.80581C3.37796 6.84362 3.46072 6.89903 3.53039 6.96888L11.9994 15.4394L20.4684 6.96888C20.5381 6.89914 20.6209 6.84383 20.712 6.80609C20.8031 6.76835 20.9008 6.74893 20.9994 6.74893C21.098 6.74893 21.1957 6.76835 21.2868 6.80609C21.3779 6.84383 21.4607 6.89914 21.5304 6.96888C21.6001 7.03861 21.6554 7.12139 21.6932 7.2125C21.7309 7.30361 21.7503 7.40126 21.7503 7.49988C21.7503 7.59849 21.7309 7.69614 21.6932 7.78725C21.6554 7.87836 21.6001 7.96114 21.5304 8.03088L12.5304 17.0309C12.4607 17.1007 12.378 17.1561 12.2868 17.1939C12.1957 17.2318 12.098 17.2512 11.9994 17.2512C11.9007 17.2512 11.8031 17.2318 11.7119 17.1939C11.6208 17.1561 11.5381 17.1007 11.4684 17.0309L2.46839 8.03088C2.39854 7.96121 2.34313 7.87844 2.30532 7.78733C2.26751 7.69621 2.24805 7.59853 2.24805 7.49988C2.24805 7.40122 2.26751 7.30354 2.30532 7.21243C2.34313 7.12131 2.39854 7.03854 2.46839 6.96888Z"
                fill="#636262"
              />
            </svg>
          </button>

          <div
            v-show="activeSection === 'use-vcaa'"
            id="use-vcaa"
            class="about-vocabulary__accordion-content"
          >

            <p class="about-vocabulary__accordion-paragraph">
              Para usar o VCAA, você pode utilizar a navegação pelas hierarquias ou a navegação por busca.
            </p>

            <p class="about-vocabulary__accordion-paragraph">
              A estrutura do vocabulário está dividida por categorias, que podem ser domínios do conhecimento ou facetas, conforme apresentado na imagem abaixo. A partir delas, os termos do VCAA são organizados por características em comum.
            </p> 
            
            <p class="about-vocabulary__accordion-paragraph">
              As categorias e/ou facetas estão sinalizadas com <... > e não apresentam definições explicativas.
            </p>

          </div>
        </article>

        <article class="about-vocabulary__accordion-item">
          <button
            type="button"
            class="about-vocabulary__accordion-trigger"
            :aria-expanded="String(activeSection === 'record-elements')"
            aria-controls="record-elements"
            @click="toggleSection('record-elements')"
          >
            <span>Elementos que compõem um registro no VCAA</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              class="about-vocabulary__accordion-icon"
              :class="{ 'about-vocabulary__accordion-icon--open': activeSection === 'record-elements' }"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M2.46839 6.96888C2.53806 6.89903 2.62082 6.84362 2.71194 6.80581C2.80305 6.768 2.90074 6.74854 2.99939 6.74854C3.09804 6.74854 3.19572 6.768 3.28684 6.80581C3.37796 6.84362 3.46072 6.89903 3.53039 6.96888L11.9994 15.4394L20.4684 6.96888C20.5381 6.89914 20.6209 6.84383 20.712 6.80609C20.8031 6.76835 20.9008 6.74893 20.9994 6.74893C21.098 6.74893 21.1957 6.76835 21.2868 6.80609C21.3779 6.84383 21.4607 6.89914 21.5304 6.96888C21.6001 7.03861 21.6554 7.12139 21.6932 7.2125C21.7309 7.30361 21.7503 7.40126 21.7503 7.49988C21.7503 7.59849 21.7309 7.69614 21.6932 7.78725C21.6554 7.87836 21.6001 7.96114 21.5304 8.03088L12.5304 17.0309C12.4607 17.1007 12.378 17.1561 12.2868 17.1939C12.1957 17.2318 12.098 17.2512 11.9994 17.2512C11.9007 17.2512 11.8031 17.2318 11.7119 17.1939C11.6208 17.1561 11.5381 17.1007 11.4684 17.0309L2.46839 8.03088C2.39854 7.96121 2.34313 7.87844 2.30532 7.78733C2.26751 7.69621 2.24805 7.59853 2.24805 7.49988C2.24805 7.40122 2.26751 7.30354 2.30532 7.21243C2.34313 7.12131 2.39854 7.03854 2.46839 6.96888Z"
                fill="#636262"
              />
            </svg>
          </button>

          <div
            v-show="activeSection === 'record-elements'"
            id="record-elements"
            class="about-vocabulary__accordion-content"
          >
            <p class="about-vocabulary__accordion-paragraph">
              Exemplo: <span class="about-vocabulary__accordion-term">"cidades"</span>.
            </p>
            <p class="about-vocabulary__accordion-paragraph">
              No registro de "cidades", você encontrará os seguintes elementos:
            </p>
            <p class="about-vocabulary__accordion-paragraph">
              <strong>Hierarquia do termo:</strong> apresenta a estrutura hierárquica do termo.
              <br />
              <span class="about-vocabulary__accordion-term">
                Arquitetura e Urbanismo &gt; Planejamento territorial urbano &gt; cidades
              </span>
            </p>
            <p class="about-vocabulary__accordion-paragraph">
              <strong>Definição síntese:</strong> uma explicação concisa sobre o termo elaborada pela equipe do
              ARQUIGRAFIA.
              <br />
              <span class="about-vocabulary__accordion-term">
                "Grande comunidade ou assentamento urbano, delimitada administrativamente e densamente povoado."
              </span>
            </p>
            <p class="about-vocabulary__accordion-paragraph">
              <strong>Nota de escopo:</strong> explicações que podem ser mais detalhadas e serviram como fonte para a
              "definição síntese".
            </p>
            <p class="about-vocabulary__accordion-paragraph">
              <strong>Termos genéricos:</strong> termos superiores na hierarquia.
              <br />
              <span class="about-vocabulary__accordion-term">Planejamento territorial urbano</span>
            </p>
            <p class="about-vocabulary__accordion-paragraph">
              <strong>Termos específicos:</strong> termos inferiores na hierarquia e que podem indicar relações como
              gênero/espécie, todo/parte. Esses termos são úteis caso você queira refinar sua busca.
              <br />
              <span class="about-vocabulary__accordion-term">
                Exemplos: cidades antigas, cidades dormitório, cidades históricas.
              </span>
            </p>
            <p class="about-vocabulary__accordion-paragraph">
              <strong>Termo equivalente em inglês:</strong> apresenta o termo em inglês que equivale ao termo recuperado.
              Em geral, ele está acompanhado da sua fonte de referência. Ao clicar no termo equivalente, você visualizará
              uma explicação em inglês.
              <br />
              <span class="about-vocabulary__accordion-term">cities (Art and Architecture Thesaurus)</span>
            </p>
          </div>
        </article>
      </section>
    </div>
  </AboutLayout>
</template>

<script>
import AboutLayout from "./AboutLayout.vue";

export default {
  name: "AboutVocabulary",
  components: {
    AboutLayout,
  },
  data() {
    return {
      activeSection: null,
    };
  },
  methods: {
    toggleSection(sectionId) {
      this.activeSection = this.activeSection === sectionId ? null : sectionId;
    },
  },
};
</script>

<style scoped>
.about-vocabulary__title {
  width: fit-content;
  font-weight: 600;
  font-size: 20px;
  line-height: 150%;
  letter-spacing: 0%;
  vertical-align: middle;
  border-bottom: 2px solid #000000;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.about-vocabulary__subtitle {
  color: #000;
  font-family: "DM Sans";
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
  margin-bottom: 24px;
}

.about-vocabulary__paragraph {
  color: #000;
  font-family: "DM Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 125%;
  margin-bottom: 16px;
}

.about-vocabulary__button {
  display: flex;
  align-items: center;
  padding: 4px 14px;
  gap: 10px;
  border-radius: 5px;
  border: 1px solid var(--Laranja_E, #AA4F28);
  background: var(--Laranja_E, #AA4F28);
  color: #fff;
  text-decoration: none;
  width: fit-content;
  margin: 32px 0;
}

.about-vocabulary__button:hover {
  color: #fff;
  text-decoration: none;
}

.about-vocabulary__accordion {
  margin-top: 40px;
  border-top: 1px solid var(--Cinza_M, #636262);
}

.about-vocabulary__accordion-item {
  border-bottom: 1px solid var(--Cinza_M, #636262);
}

.about-vocabulary__accordion-trigger {
  width: 100%;
  display: flex;
  height: 72px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
  border: 0;
  background: transparent;
  color: #000;
  text-align: left;
  font-family: "DM Sans";
  font-size: 18px;
  font-style: normal;
  font-weight: 400;
  line-height: 140%;
}

.about-vocabulary__accordion-trigger span {
  color: var(--Preto, #1F1F1F);
  font-family: "DM Sans";
  font-size: 20px;
  font-style: normal;
  font-weight: 500;
  line-height: 150%;
}

.about-vocabulary__accordion-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.about-vocabulary__accordion-icon--open {
  transform: rotate(180deg);
}

.about-vocabulary__accordion-content {
  padding: 0 0 18px;
}

.about-vocabulary__accordion-paragraph {
  color: #000;
  font-family: "DM Sans";
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 125%;
}

.about-vocabulary__accordion-term {
  color: var(--Laranja_E, #AA4F28);
}

@media (min-width: 768px) {
  .about-vocabulary__title {
    width: fit-content;
    font-weight: 600;
    font-size: 30px;
    line-height: 150%;
    letter-spacing: 0%;
    vertical-align: middle;
    margin-bottom: 55px;
    border-bottom: 4px solid #000000;
    padding-bottom: 20px;
  }

  .about-vocabulary__subtitle {
    color: #000;
    font-family: "DM Sans";
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
    max-width: 576px;
    margin-bottom: 32px;
  }

  .about-vocabulary__paragraph {
    color: #000;
    font-family: "DM Sans";
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 125%;
    max-width: 700px;
    padding-left: 48px;
  }

  .about-vocabulary__button {
    margin-left: 48px;
  }

  .about-vocabulary__accordion {
    max-width: 700px;
    margin-top: 36px;
  }

  .about-vocabulary__accordion-trigger {
    font-size: 31px;
    line-height: 125%;
    padding: 22px 0;
  }

  .about-vocabulary__accordion-content {
    display: flex;
    padding: 0 0 32px 48px;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    align-self: stretch;
  }

}
</style>
