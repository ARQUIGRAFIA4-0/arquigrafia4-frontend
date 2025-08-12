// Mock API service for images
const generateMockItems = (page, limit = 12) => {
  const items = [];
  const baseUrl = "https://www.arquigrafia.org.br/arquigrafia-images";

  for (let i = 0; i < limit; i++) {
    const id = Math.floor(Math.random() * 15000) + 1;
    items.push({
      id,
      title: `Imagem ${id}`,
      imageUrl: `${baseUrl}/${id}_view.jpg`,
    });
  }

  // Simulate API delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        items,
        hasMore: page < 5, // Simulate a limit of 5 pages for demo
      });
    }, 500);
  });
};

export const api = {
  getImages: generateMockItems,
};
