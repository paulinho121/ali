// This service helps identify trending products or niches
// In a real-world scenario, you might use a TikTok/IG scraping API
// For now, we use a mix of hardcoded viral niches and Gemini-powered brainstorming

const niches = [
    'utilidades domésticas criativas',
    'gadgets tecnológicos para setup',
    'brinquedos inovadores para pets',
    'beleza e cuidados pessoais inteligentes',
    'acessórios de carro práticos'
];

async function getDailyTrends() {
    // Returns a random niche to keep variety in posts
    const selectedNiche = niches[Math.floor(Math.random() * niches.length)];
    return {
        niche: selectedNiche,
        keywords: selectedNiche.split(' ')
    };
}

module.exports = {
    getDailyTrends
};
