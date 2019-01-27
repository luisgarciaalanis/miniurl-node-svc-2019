const Sequelize = require('sequelize');
const appSettings = require('../../core/settings/AppSettings');
const log = require('../../core/log');
const models = require('./Models');

class MiniURLDB {
    constructor() {
        this.reserveUrl = this.reserveUrl.bind(this);
        this.findUrlHash = this.findUrlHash.bind(this);
        this.storeUrl = this.storeUrl.bind(this);
        this.findUrl = this.findUrl.bind(this);
    }

    /**
     * initializes the database connection.
     */
    async init() {
        let connected = false;

        const dbSchema = appSettings.valueOf(appSettings.DB_SCHEMA);
        const dbUsername = appSettings.valueOf(appSettings.DB_USERNAME);
        const dbPassword = appSettings.valueOf(appSettings.DB_PASSWORD);
        const dbHost = appSettings.valueOf(appSettings.DB_HOST);

        this.db = new Sequelize(dbSchema, dbUsername, dbPassword, {
            host: dbHost,
            dialect: 'mysql',
            operatorsAliases: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        });

        try {
            await this.db.authenticate();
            connected = true;
        } catch (e) {
            log.error(e);
        }

        models.init(this.db);

        return connected;
    }


    /**
     * Reserves a URL in the database and returns the id.
     */
    async reserveUrl() {
        let newUrl = -1;
        try {
            newUrl = await models.urls.create();
        } catch (e) {
            log.error('reserveUrl: Unable to reserve index for new URL hash.');
            log.error(e);
            throw e;
        }

        return newUrl.id;
    }

    /**
     * finds a hash for a url.
     * @param {string} url
     * @returns {string|null} the hash if found null otherwise.
     */
    async findUrlHash(url) {
        let foundUrl = null;

        try {
            foundUrl = await models.urls.findOne({ where: { url } });
        } catch (e) {
            log.error('findUrlHash failed to fetchOne url');
            log.error(e);
            throw e;
        }

        if (!foundUrl) {
            return null;
        }

        return foundUrl.hash;
    }

    /**
     * finds a url for a hash.
     * @param {string} hash
     * @returns {string|null} the url if found null otherwise.
     */
    async findUrl(hash) {
        let foundUrl = null;

        try {
            foundUrl = await models.urls.findOne({ where: { hash } });
        } catch (e) {
            log.error('findUrl: failed to fetchOne url');
            log.error(e);
            throw e;
        }

        if (!foundUrl) {
            return null;
        }

        return foundUrl.url;
    }

    /**
     * Stores a URL in the database.
     * @param {*} id id of the existing reserved URL.
     * @param {*} url url to save.
     * @param {*} hash hash associated with the url.
     *
     * @returns {boolean} true if succeeds false otherwise.
     */
    async storeUrl(id, url, hash) {
        let result = null;

        try {
            result = await models.urls.update({
                url,
                hash,
            }, {
                where: {
                    id,
                },
            });
        } catch (e) {
            log.error(`storeUrl: failed to update id: ${id} url: ${url} with hash: ${hash}`);
            log.error(e);
        }

        if (!result) {
            return false;
        }

        return true;
    }
}

module.exports = new MiniURLDB();
