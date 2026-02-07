<template>
  <AboutLayout>
    <div class="col-12 col-md-8">
      <h1 class="about-project__title">ARQUIGRAFIA 4.0</h1>
    </div>
    <div class="col-12 col-md-8">
      <h2 class="about-project__subtitle">Uma experiência de pesquisa baseada na colaboração</h2>
      <p class="about-project__paragraph">A internet pode ser um espaço de intenso compartilhamento de experiências,
        de pesquisa, de aprendizagem e de intercâmbio de conhecimentos. Esse potencial estimulou o desenvolvimento
        do projeto Arquigrafia: uma
        plataforma colaborativa de compartilhamento e interpretação de imagens de Arquitetura e Urbanismo na web.
      </p>
      <p class="about-project__paragraph">
        Como um espaço público, aberto e gratuito o Arquigrafia empreende a construção de uma coleção de imagens
        digitais de edifícios e espaços urbanos do Brasil e da comunidade lusófona, a partir da colaboração de
        usuários particulares - estudantes, arquitetos, pesquisadores, docentes, fotógrafos, leigos interessados no
        tema - e usuários institucionais: bibliotecas, museus, grupos de pesquisa, laboratórios, coletivos,
        institutos públicos e privados.
      </p>
      <div class="about-project__horizontal-image-wrapper">
        <img src="@/assets/about_project_img_01.jpg" alt="Arquigrafia" class="about-project__horizontal-image" />
      </div>
      <p class="about-project__paragraph">
        Idealizado em 2008 na Universidade de São Paulo, na Faculdade de Arquitetura e Urbanismo e de Design
        (FAU-USP) como um projeto multidisciplinar em parceria com pesquisadores do Instituto de Matemática e
        Estatística (IMEUSP), da Escola de Comunicação e Artes (ECAUSP) e da Faculdade de Direito do Largo
        S.Francisco (FDUSP), o Arquigrafia tem como objetivo principal contribuir de maneira complementar para o
        ensino e a difusão da cultura arquitetônica e urbanística por meio de interações e juízos críticos sobre
        imagens digitais.
      </p>
      <p class="about-project__paragraph">
        Desde então, com o apoio da RNP, da FAPESP, do CNPq, das Pró-reitorias de Pesquisa e de Cultura e Extensão
        da USP e da Diretoria da FAUUSP o projeto se constituiu como um laboratório de pesquisa para todas essas
        áreas de conhecimento, produzindo conhecimento, desenvolvendo Ciência e Tecnologia, fomentando pesquisas em
        nível de graduação e pós-graduação, e formando dezenas de jovens pesquisadores de diversas áreas.
      </p>
    </div>
    <div class="d-none d-md-block col-md-4">
      <div class="about-project__vertical-image-wrapper">
        <img src="@/assets/about_project_img_03.jpg" alt="Arquigrafia" class="about-project__vertical-image-wrapper" />
      </div>
    </div>
    <div class="col-12 col-md-8">
      <h2 class="about-project__subtitle--quote">
        Online desde 2011, o Arquigrafia é hoje uma plataforma colaborativa temática com mais de 14 mil imagens de
        arquiteturas e espaços urbanos, disponibilizadas para livre acesso, com direitos autorais protegidos por
        licenças Creative Commons.
      </h2>
      <p class="about-project__paragraph">
        Entre 2012 e 2017, em parceria com a Seção de Material Iconográfico da Biblioteca da FAU-USP, a equipe do
        Arquigrafia desenvolveu um intenso trabalho de conservação de material fotográfico original, digitalização e
        difusão web que faculta o acesso público e gratuito a um dos mais relevantes acervos de imagens fotográficas
        de arquitetura e urbanismo. Historicamente, esse acervo fotográfico também se constituiu, desde os anos
        1960, de maneira colaborativa, com doações de estudantes, professores e pesquisadores.
      </p>
      <div class="about-project__horizontal-image-wrapper">
        <img src="@/assets/about_project_img_02.jpg" alt="Arquigrafia" class="about-project__horizontal-image" />
      </div>
      <p class="about-project__paragraph">
        Como reconhecimento dos esforços realizados, o Arquigrafia recebeu o primeiro prêmio na categoria
        “Tecnologias Sociais Aplicadas e Humanas” da Agência de Inovação USP em novembro de 2011; recebeu em 2013
        uma chancela do Ministério da Cultura (MinC) pela relevância da iniciativa para a cultura brasileira e seu
        mapeamento, e foi o projeto selecionado no edital público “Cultura na Copa 2014” (MinC) na área de
        Arquitetura.
      </p>
    </div>
    <div class="d-none d-md-block col-md-4">
      <div class="about-project__vertical-image-wrapper">
        <img src="@/assets/about_project_img_04.jpg" alt="Arquigrafia" class="about-project__vertical-image-wrapper" />
      </div>
    </div>
    <div class="col-12 col-md-8">
      <p class="about-project__paragraph">
        Desde 2022, como projeto temático FAPESP Experiência Arquigrafia 4.0, a equipe aprofunda estudos sobre as
        relações entre a experiência direta e sensível dos ambientes urbanos e suas representações digitais,
        investigando as possibilidades de convergências de dados para uma determinada posição geográfica específica
        em um lugar concreto na cidade. Essa investigação produziu, dentre outros resultados, uma versão 4.0 do
        sistema disponível desde o início de 2026.
      </p>
      <h2 class="about-project__subtitle--quote">
        Para participar e colaborar com o Arquigrafia basta acessar o site, criar um login e começar a interagir com
        outros usuários e com um universo de imagens digitais originais e em boa parte inéditas.
      </h2>
      <button class="about-project__button" @click="goToLogin">Faça parte da comunidade</button>
      <p class="about-project__paragraph">
        Cada imagem disponível no site está catalogada e georreferenciada, e é possível inserir comentários e
        registros de impressões sobre as características das arquiteturas e espaços urbanos representados, além de
        organizar coleções próprias em álbuns. O site tem ainda várias outras funcionalidades e, para usuários
        cadastrados, permite download de imagens em alta resolução.
      </p>
      <p class="about-project__paragraph">
        A plataforma é responsiva, o que possibilita colocar o sistema “na palma da mão” de quem circula pelas
        cidades. Com isso os usuários podem comparar as transformações que um edifício ou um trecho urbano sofreram
        no tempo, além de poder realizar novas fotografias in loco e compartilhar suas contribuições com novas
        imagens também georreferenciadas no sistema. Desse modo, o Arquigrafia pretende estimular a vivência
        sensível, crítica e propositiva dos espaços urbanos, promovendo, assim, também uma maior interação entre
        usuários, tanto online, quanto diretamente nos ambientes urbanos.
      </p>
    </div>
    <div class="d-none d-md-block col-md-4">
      <div class="about-project__vertical-image-wrapper">
        <img src="@/assets/about_project_img_05.jpg" alt="Arquigrafia" class="about-project__vertical-image-wrapper" />
      </div>
    </div>
  </AboutLayout>
</template>

<script setup>
import AboutLayout from "./AboutLayout.vue";

const goToLogin = () => {
  window.location.href = '/login';
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

.about-project {
  &__title {
    width: fit-content;
    font-weight: 500;
    font-size: 20px;
    line-height: 150%;
    letter-spacing: 0%;
    vertical-align: middle;
    border-bottom: 4px solid #000000;
    padding-bottom: 28px;
    margin-bottom: 48px;

    @include md {
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
  }

  &__subtitle {
    @include md {
      font-weight: 500;
      font-size: 20px;
      line-height: 150%;
      letter-spacing: 0%;
      margin-bottom: 32px;
    }

    &--quote {
      @include md {
        margin: 32px 0;
        padding-right: 120px;
      }
    }
  }

  &__paragraph {
    font-weight: 500;
    font-size: 16px;
    line-height: 150%;
    letter-spacing: 0%;

    @include md {
      font-weight: 500;
      font-size: 16px;
      line-height: 150%;
      letter-spacing: 0%;
      padding: 0 48px;
    }
  }

  &__button {
    @include md {
      background: var(--Laranja_E, #AA4F28);
      border: 1px solid var(--Laranja_E, #AA4F28);
      color: #FFFFFF;
      font-weight: 400;
      font-size: 14px;
      line-height: 150%;
      letter-spacing: 0%;
      margin-bottom: 32px;
      gap: 10px;
      padding: 2px 14px;
      border-width: 1px;
      border-radius: 5px;
    }
  }

  &__vertical-image-wrapper {
    @include md {
      width: 100%;
      height: 100%;
      max-height: 450px;
      overflow: hidden;
    }
  }

  &__vertical-image-wrapper {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__horizontal-image-wrapper {
    padding-right: 100px;

    @include md {
      width: 100%;
      margin: 32px 0;
      padding-right: 200px;
    }
  }

  &__horizontal-image {
    width: 100%;
    height: auto;
    display: block;
  }
}
</style>