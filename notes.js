const crypto = require('crypto');

async function hashString(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
}

(async () => {
    const hash = await hashString('fdfwefewf');
    console.log(hash);
})();
