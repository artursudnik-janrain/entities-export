"use strict";

const fs = require('fs');

module.exports = {
    async get() {
        return await fs.promises.readFile('data/state.json')
            .then(fileContent => JSON.parse(fileContent.toString()))
            .catch((err) => {
                if (err.code === 'ENOENT') {
                    return {};
                }
                return Promise.reject(err);
            });
    },

    async save(state) {
        fs.promises.writeFile('data/state.json', JSON.stringify(state, null, 4));
    }
};