const { Sequelize, DataTypes } = require("sequelize");
const database = require("./../instance/user_instance");

const table = database.define(
    "mic_job",
    {
        // attributes
        job_id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
        },
        jobCategory: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        jobName: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
        },
        jobDetail: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        jobObjective: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        KickOffDate: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        FinishDate: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        divisionCode: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        jobStatus: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: "open",
        },
        jobProcess: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        fileDetail: {
            type: Sequelize.DataTypes.BLOB("long"),
            allowNull: true,
        },
        fileType: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        requestBy: {
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
