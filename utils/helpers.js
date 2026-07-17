function getStars(rating) {
    if (!rating) return '☆☆☆☆☆';
    let s = '';
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    for (let i = 0; i < full; i++) s += '★';
    if (half) s += '½';
    for (let i = s.length; i < 5; i++) s += '☆';
    return s;
}

function formatPrice(price) {
    return `₹${Number(price).toFixed(2)}`;
}

module.exports = { getStars, formatPrice };