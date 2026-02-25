import lab01Projeto from '@/assets/lab_01_projeto.jpg';
import lab01Pesquisador from '@/assets/lab_01_pesquisador.jpeg';

export const labProjects = [
    {
        id: 1,
        slug: "centro-historico-sp",
        cardTitle: "Centro Histórico de São Paulo em 3D - Projeto Piloto",
        fullTitle: "Modelo tridimensional do Centro Histórico de São Paulo",
        image: lab01Projeto,
        cardDescription: "Explore as camadas históricas e a transformação urbana ao longo do tempo em um ambiente digital interativo.",
        fullDescription: `<p>O ARQUIGRAFIA apresenta uma nova forma de representação de sítios históricos em um ambiente 3D baseado na web. Por meio da navegação ao longo do tempo, os usuários podem explorar o processo de transformação histórica e de verticalização do Centro Histórico de São Paulo. A plataforma permite percorrer diferentes décadas e compreender visualmente como os edifícios surgiram, se transformaram ou desapareceram ao longo do tempo. Em qualquer momento da linha do tempo histórica, os usuários podem selecionar edifícios individuais e interagir com seus metadados associados, incluindo características arquitetônicas, períodos de construção, materiais e imagens ilustrativas. Além da exploração, o sistema possibilita a participação colaborativa: os usuários podem contribuir com informações adicionais, referências, imagens e links externos relacionados a um edifício específico e a um período específico de sua história. O ARQUIGRAFIA 3D é desenvolvida como um projeto piloto para o Centro Histórico de São Paulo, com possibilidade de extensão para outros centros históricos.</p>`,
        researcher: {
            name: "Sayed Samimi",
            avatar: lab01Pesquisador,
            bio: `<a href="http://lattes.cnpq.br/6667250885230745" target="_blank" rel="noopener noreferrer">Sayed Abdul Basir Samimi</a> é pesquisador colaborador da Faculdade de Arquitetura e Urbanismo e de Design da Universidade de São Paulo (FAU-USP) e membro da equipe de pesquisa e desenvolvimento do ARQUIGRAFIA 4.0. Sua atuação concentra-se em patrimônio urbano e representações digitais das cidades. É um dos autores do artigo "City Profile: Transformations and Challenges of São Paulo's Historic Triangle" (<a href="https://doi.org/10.1016/j.cities.2024.105529" target="_blank" rel="noopener noreferrer">Cities, 2025</a>), no qual é introduzido o conceito de camadas urbanas geracionais e são analisados os processos de transformação urbana e verticalização de longo prazo no centro histórico de São Paulo.`,
        },
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
                url: "https://exemplo.com/manual",
            },
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
