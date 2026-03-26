import lab01Projeto from '@/assets/lab_01_projeto.jpg';
import lab02Projeto from '@/assets/lab_02_projeto.jpg';
import lab03Projeto from '@/assets/lab_03_projeto.jpg';
import lab01Pesquisador01 from '@/assets/lab_01_pesquisador01.jpeg';
import lab02Pesquisador01 from '@/assets/lab_02_pesquisador01.png';
import lab02Pesquisador02 from '@/assets/lab_02_pesquisador02.jpg';
import lab02Pesquisador03 from '@/assets/lab_02_pesquisador03.png';
import lab02Pesquisador04 from '@/assets/lab_02_pesquisador04.png';
import lab03Pesquisador01 from '@/assets/lab_03_pesquisador01.png';
import lab03Pesquisador02 from '@/assets/lab_03_pesquisador02.png';

export const labProjects = [
    {
        id: 1,
        slug: "centro-historico-sp",
        cardTitle: "Centro Histórico de São Paulo em 3D - Projeto Piloto",
        fullTitle: "Modelo tridimensional do Centro Histórico de São Paulo",
        subTitle: "Explore as camadas históricas e a transformação urbana ao longo do tempo em um ambiente digital interativo.",
        image: lab01Projeto,
        fullDescription: `<p>O ARQUIGRAFIA apresenta uma nova forma de representação de sítios históricos em um ambiente 3D baseado na web. Por meio da navegação ao longo do tempo, os usuários podem explorar o processo de transformação histórica e de verticalização do Centro Histórico de São Paulo. A plataforma permite percorrer diferentes décadas e compreender visualmente como os edifícios surgiram, se transformaram ou desapareceram ao longo do tempo. Em qualquer momento da linha do tempo histórica, os usuários podem selecionar edifícios individuais e interagir com seus metadados associados, incluindo características arquitetônicas, períodos de construção, materiais e imagens ilustrativas. Além da exploração, o sistema possibilita a participação colaborativa: os usuários podem contribuir com informações adicionais, referências, imagens e links externos relacionados a um edifício específico e a um período específico de sua história. O ARQUIGRAFIA 3D é desenvolvido como um projeto piloto para o Centro Histórico de São Paulo, com possibilidade de extensão para outros centros históricos.</p>`,
        researchers: [{
            name: "Sayed Samimi",
            avatar: lab01Pesquisador01,
            bio: `<a href="http://lattes.cnpq.br/6667250885230745" target="_blank" rel="noopener noreferrer">Sayed Abdul Basir Samimi</a> é pesquisador colaborador da Faculdade de Arquitetura e Urbanismo e de Design da Universidade de São Paulo (FAU-USP) e membro da equipe de pesquisa e desenvolvimento do ARQUIGRAFIA 4.0. Sua atuação concentra-se em patrimônio urbano e representações digitais das cidades. É um dos autores do artigo "City Profile: Transformations and Challenges of São Paulo's Historic Triangle" (<a href="https://doi.org/10.1016/j.cities.2024.105529" target="_blank" rel="noopener noreferrer">Cities, 2025</a>), no qual é introduzido o conceito de camadas urbanas geracionais e são analisados os processos de transformação urbana e verticalização de longo prazo no centro histórico de São Paulo.`,
        }],
        links: [
            {
                type: "project",
                label: "Acessar projeto",
                url: "https://3d.arquigrafia.org.br/",
            },
            {
                type: "publications",
                label: "Publicações",
                url: "https://doi.org/10.1016/j.cities.2024.105529",
            },
            {
                type: "manual",
                label: "Manual",
                url: "https://www.instagram.com/reels/DWFMn4xDvBF",
            },
        ],
    },
    {
        id: 2,
        slug: "museu-aberto",
        cardTitle: "Museu Aberto",
        fullTitle: "Museu Aberto",
        subTitle: "Conheça o projeto piloto experimental com informações em áudio georreferenciadas.",
        image: lab02Projeto,
        fullDescription: `<p>O projeto piloto Museu Aberto (originalmente Open-Air Museum) promoveu em 2017 uma convergência experimental entre o Arquigrafia e o projeto Smart Audio City Guide (2013), ambos desenvolvidos por equipes multidisciplinares de pesquisadores da Universidade de São Paulo (USP). O Smart Audio City Guide foi um experimento de construção de um ambiente colaborativo com informações em áudio georreferenciadas, eminentemente não visuais, que visavam estimular interações com pessoas cegas e com baixa visão. O conceito de Museu Aberto, nesse piloto, considerou que a interação com paisagens, espaços e objetos urbanos pode ser enriquecida com a presença in loco de representações em áudios relacionadas às situações vivenciadas. Tais mensagens estimulam ressignificações, reposicionamentos e revisões contínuas dos conhecimentos construídos a respeito de temas pertinentes às cidades, suas dinâmicas e transformações. O piloto foi realizado no Eixo das Humanas, na Cidade Universitária Armando Sales Oliveira, Campus USP Butantã com estudantes da FAU-USP.</p>`,
        researchers: [
            {
                name: "Ana Paula Oliveira Bertholdo",
                avatar: lab02Pesquisador01,
                bio: `Ana Paula Oliveira Bertholdo (Equipe Arquigrafia). Doutora e Mestre em Ciência da Computação pelo IME-USP, com graduação em Tecnologia em Informática pela FT-UNICAMP. Tem experiência nas áreas de Engenharia de Software e Interação Humano-Computador, especialmente nos seguintes temas: análise e desenvolvimento de sistemas, usabilidade com métodos ágeis, engajamento de usuários e gamificação em sistemas colaborativos.`,
            },
            {
                name: "João Henrique Kersul",
                avatar: lab02Pesquisador02,
                bio: `João Henrique Kersul Faria (Equipe Arquigrafia). Graduado em Engenharia Elétrica com Ênfase em Computação na Escola Politécnica da Universidade São Paulo (POLI-USP). Desenvolveu o projeto Open Air Museum através do programa de Iniciação Científica do INCT.`,
            },
            {
                name: "Flávio Soares Corrêa da Silva",
                avatar: lab02Pesquisador03,
                bio: `Flávio Soares Corrêa da Silva (IME-USP). Professor associado junto ao Instituto de Matemática e Estatística da Universidade de São Paulo (IME-USP), coordenador do Laboratório / Grupo de Pesquisa CNPq “Laboratório de Interatividade e Entretenimento Digital”.`,
            },
            {
                name: "Equipe Arquigrafia",
                avatar: lab02Pesquisador04,
                bio: `Equipe Arquigrafia.`,
            }
        ],
        links: [
            {
                type: "project",
                label: "Acessar projeto",
                url: "https://www.arquigrafia.org.br/oam",
            },
            {
                type: "publications",
                label: "Publicações",
                url: "https://journals-sol.sbc.org.br/index.php/comp-br/article/view/5072",
            }
        ],
    },
    {
        id: 3,
        slug: "acervos-digitais-e-pesquisa",
        cardTitle: "Acervos Digitais e Pesquisa",
        fullTitle: "Acervos Digitais e Pesquisa",
        subTitle: "Navegue em visualizações do acervo ARQUIGRAFIA organizadas por cor e material a partir da IA.",
        image: lab03Projeto,
        fullDescription: `<p>O Projeto Temático FAPESP Acervos Digitais e Pesquisa propôs uma colaboração com o Projeto ARQUIGRAFIA que resultou no protótipo Visão computacional aplicada a arquivos de arquitetura, arte e design. Nessa iniciativa, a equipe do Acervos Digitais experimentou recursos de Visão Computacional para analisar e organizar imagens do acervo colaborativo do ARQUIGRAFIA com base em categorias pertinentes à arquitetura, às artes e ao design, aos materiais e à natureza (elementos naturais). Cada uma dessas categorias possui subcategorias, como por exemplo: toldo/marquise, varanda, porta, coluna/pilar, corrimão/balaústre, escada, torre/chaminé e janela. Essas categorias e subcategorias podem se valer ainda de um filtro cromático para a seleção de imagens. Com tais recursos, o protótipo apresenta “camadas de legibilidade do acervo que não eram visíveis no formato de sua catalogação original”. Todos esses recursos estão disponíveis no protótipo que está disponível no GitHub do projeto Acervos Digitais e podem ser acessados neste link.</p>`,
        researchers: [
            {
                name: "Acervos Digitais e Pesquisa",
                avatar: lab03Pesquisador01,
                bio: `Acervos Digitais e Pesquisa é um Projeto Temático financiado pela FAPESP na chamada LinCar. Seu objetivo é desenvolver metodologias e um repertório teórico-conceitual para coleções de museus e documentos digitais, por meio da conceituação e prototipagem de interfaces acessíveis e economicamente sustentáveis.`,
            },
            {
                name: "Equipe Arquigrafia",
                avatar: lab03Pesquisador02,
                bio: `Equipe Arquigrafia.`,
            }
        ],
        links: [
            {
                type: "project",
                label: "Acessar projeto",
                url: "https://acervos-digitais.github.io/arquigrafia-interface/",
            },
            {
                type: "publications",
                label: "Ler mais",
                url: "https://www.acervosdigitais.fau.usp.br/visao-computacional-aplicada-a-arquivos-de-arquitetura-arte-e-design/",
            }
        ],
    }
];

/**
 * Busca um projeto pelo slug
 * @param {string} slug - O slug a ser buscado
 * @returns {object|null} O objeto do projeto, ou null se não encontrado
 */
export function findProjectBySlug(slug) {
    return labProjects.find(project => project.slug === slug) || null;
}

/**
 * Verifica se um projeto existe com o slug fornecido
 * @param {string} slug - O slug a ser verificado
 * @returns {boolean} Verdadeiro se o projeto existir, falso caso contrário
 */
export function projectExists(slug) {
    return labProjects.some(project => project.slug === slug);
}
