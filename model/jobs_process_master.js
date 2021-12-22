const { Sequelize, DataTypes } = require("sequelize");
const database = require("./../instance/user_instance");

const table = database.define(
    "jobs_process_master",
    {
        jobProcess: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false,
        },
        jobWeight: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        piority: {
            type: Sequelize.INTEGER,
            allowNull: false,
            unique: true,
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
