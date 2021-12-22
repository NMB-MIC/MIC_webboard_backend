const { Sequelize, DataTypes } = require("sequelize");
const database = require("./../instance/user_instance");

const table = database.define(
    "mic_job_progressive",
    {
        // attributes
        progressive_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        job_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        progressiveName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        progressiveType: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        progressiveDetail: {
            type: Sequelize.STRING('MAX'),
            allowNull: false,
        },
        fileDetail: {
            type: Sequelize.DataTypes.BLOB("long"),
            allowNull: true,
        },
        fileType: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        updateBy: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    },
    {
        //option
    }
);

(async () => {
    await table.sync({ force: false });
})();

module.exports = table;
