<template>
  <AboutLayout>
    <div class="col-12 col-md-8">
      <h1 class="about-faq__title">Perguntas frequentes</h1>
    </div>
    <div class="col-12 col-md-8">
      <div class="about-faq__item">
        <h2 class="about-faq__question">
          Posso fazer uso comercial das imagens do ARQUIGRAFIA?
        </h2>
        <p class="about-faq__answer">
          Se a licença Creative Commons atribuída pelo autor da imagem permitir esse uso sim - Atribuição (BY) -, desde
          que seja dado crédito pela criação original. Se a licença restringir o uso comercial, não há permissão do
          autor
          para tanto, e eventuais usos indevidos estarão sujeitos às penalidades legais cabíveis.
        </p>
      </div>

      <div class="about-faq__item">
        <h2 class="about-faq__question">
          Posso utilizar as imagens do ARQUIGRAFIA em publicações?
        </h2>
        <p class="about-faq__answer">
          Se a publicação for comercializada, cabem os esclarecimentos refentes ao uso comercial de imagens do
          ARQUIGRAFIA. Se a publicação não for comercializada, o uso das imagens deve ser pautado pela licença Creative
          Commons atribuída pelo autor. Em todo caso, a autoria deve sempre ser mencionada.
        </p>
      </div>

      <div class="about-faq__item">
        <h2 class="about-faq__question">
          Todas as imagens do ARQUIGRAFIA tem a mesma licença Creative Commons?
        </h2>
        <p class="about-faq__answer">
          Não, cada autor atribui uma licença específica às suas imagens, e pode mesmo atribuir licenças distintas para
          cada uma de suas imagens.
        </p>
      </div>

      <div class="about-faq__item">
        <h2 class="about-faq__question">
          Se eu fizer um download de uma imagem do Acervo da Biblioteca da FAUUSP disponível no ARQUIGRAFIA, como posso
          reconhecer esta imagem depois, em meio a outras nos meus arquivos pessoais?
        </h2>
        <p class="about-faq__answer">
          Clicando com o botão direito do mouse sobre a imagem acesse 'Propriedades'. Em seguida entre em 'Detalhes' e
          verifique a propriedade 'Origem', no qual constam os Direitos Autorais, e outros metadados. A informação que
          consta neste campo irá mencionar FAU e depois a licença CC atribuída pelo autor ou por seus familiares, como
          por
          exemplo: FAU - Creative Commons 3.0 BY-NC-ND
        </p>
      </div>

      <div class="about-faq__item">
        <h2 class="about-faq__question">
          Posso solicitar a correção de alguma informação disponível no sistema que esteja incorreta?
        </h2>
        <p class="about-faq__answer">
          Sim, certamente. Espera-se que a colaboração contínua dos usuários contribua para o aprimoramento e a correção
          das informações disponíveis no ARQUIGRAFIA. Para tanto, basta entrar em contato por e-mail com a equipe
          responsável pelo projeto no e-mail ARQUIGRAFIA@usp.br
        </p>
      </div>

      <div class="about-faq__item">
        <h2 class="about-faq__question">
          Como faço para remover uma fotografia que enviei?
        </h2>
        <p class="about-faq__answer">
          Entre em seu perfil de usuário e em 'Minhas imagens' clique sobre a imagem que deseja remover. Assim que
          surgirem os botões para interação, clique no ícone 'Remover'.
        </p>
      </div>

      <div class="about-faq__item">
        <h2 class="about-faq__question">
          Posso criar um álbum com qualquer imagem do sistema?
        </h2>
        <p class="about-faq__answer">
          Sim, todas as imagens disponíveis no ARQUIGRAFIA podem ser organizadas em álbum. Entretanto, a autoria é
          alienável, a licença atribuída pelo autor deve ser respeitada e se eventualmente o autor retirar essa imagem
          do
          ARQUIGRAFIA, esta será retirada do seu álbum.
        </p>
      </div>

      <div class="about-faq__item">
        <h2 class="about-faq__question">
          Ainda precisando de Ajuda?
        </h2>
        <p class="about-faq__answer">
          Esta é uma versão beta do ARQUIGRAFIA e ainda pode conter erros. Caso tenha alguma dificuldade técnica,
          dúvidas
          ou perceba problemas na navegação escreva para: ARQUIGRAFIA@usp.br
        </p>
      </div>
    </div>
  </AboutLayout>
</template>

<script>
import AboutLayout from "./AboutLayout.vue";

export default {
  name: "AboutFaq",
  components: {
    AboutLayout,
  },
};
</script>

<style lang="scss" scoped>
@use "@/scss/variables" as *;
$breakpoint-md: 768px;

@mixin md {
  @media (min-width: #{$breakpoint-md}) {
    @content;
  }
}

.about-faq {
  &__title {
    width: fit-content;
    font-size: 20px;
    font-weight: 600;
    line-height: 150%;
    vertical-align: middle;
    padding-bottom: 16px;
    border-bottom: 2px solid #000000;
    margin-bottom: 46px;

    @include md {
      font-size: 30px;
      padding-bottom: 20px;
      border-bottom: 4px solid #000000;
      margin-bottom: 55px;
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }

  &__question {
    font-size: 16px;
    font-weight: 500;
    line-height: 150%;
    color: var(--Laranja_M);
    margin: 0;

    @include md {}
  }

  &__answer {
    font-size: 12px;
    font-weight: 400;
    line-height: 125%;
    margin: 0;

    @include md {}
  }
}
</style>
