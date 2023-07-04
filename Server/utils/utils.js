function generateId(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    let id = '';

    for (let i = 0; i < length; i++) {
        id += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return id;
}

module.exports = {
    generateId
}