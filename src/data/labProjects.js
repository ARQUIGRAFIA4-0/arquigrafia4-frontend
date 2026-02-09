export const labProjects = [
    {
        id: 1,
        slug: "centro-historico-sp",
        cardTitle: "Centro histórico de SP",
        fullTitle: "Modelo tridimensional do Centro Histórico de São Paulo",
        image: "/src/assets/lab_01_projeto.png",
        cardDescription: "Lorem ipsum dolor sit amet consectetur. Lectus hac rhoncus integer at urna tellus mauris.",
        fullDescription: `
      <p>Lorem ipsum dolor sit amet consectetur. Suspendisse tempor sagittis mi ipsum suscipit a pulvinar sit enim. Malesuada feugiat in sollicitudin id ultricies tincidunt aliquet egestas. Mauris consequat sed bibendum viverra et ullamcorper lobortis. Mollis amet dictum fusce id. Hendrerit dui lacus massa cras purus. Tincidunt malesuada iaculis semper lectus purus egestas mauris proin nibh. Volutpat lorem sed ridiculus urna et vel lacus quam. Neque faucibus faucibus fringilla enim mattis gravida mauris. Dictum in ullamcorper iaculis venenatis sed et. Nam nisi neque tristique cras porttitor malesuada platea. Ipsum molestie turpis semper accumsan in auctor netus. Vulputate fermentum dolor vitae fringilla aliquet purus scelerisque mi eleifend. Sit lacinia ultrices sed nunc. Tincidunt ipsum ac ac in gravida.</p>
      <p>Lorem ipsum dolor sit amet consectetur. Suspendisse tempor sagittis mi ipsum suscipit a pulvinar sit enim. Malesuada feugiat in sollicitudin id ultricies tincidunt aliquet egestas. Mauris consequat sed bibendum viverra et ullamcorper lobortis. Mollis amet dictum fusce id. Hendrerit dui lacus massa cras purus. Tincidunt malesuada iaculis semper lectus purus egestas mauris proin nibh. Volutpat lorem sed ridiculus urna et vel lacus quam. Neque faucibus faucibus fringilla enim mattis gravida mauris. Dictum in ullamcorper iaculis venenatis sed et.</p>
    `,
        researcher: {
            name: "Sayed Samimi",
            avatar: "/src/assets/lab_01_pesquisador.jpeg",
            bio: "Sayed Samimi acredita que utilizar a plataforma Arquigrafia como ferramenta de pesquisa para a conservação do patrimônio cultural em São Paulo será uma excelente oportunidade de aprimoramento metodológico e interpretativo. “O Arquigrafia é uma plataforma digital que facilita a partilha e preservação da fotografia arquitetônica e urbana, disponibilizando recursos valiosos para a minha investigação.",
        },
        links: [
            {
                type: "project",
                label: "Acessar projeto",
                url: "https://3d.arquigrafia.org.br/",
            },
            {
                type: "share",
                label: "Compartilhar",
                url: "#share",
            },
            {
                type: "publications",
                label: "Publicações",
                url: "https://exemplo.com/publicacoes",
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
