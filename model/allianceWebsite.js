const { Sequelize, DataTypes } = require("sequelize");
const database = require("./../instance/user_instance");

const table = database.define(
    "alliance_website",
    {
        websiteName: {
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false,
        },
        websiteDiscription: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        websiteLink: {
            type: Sequelize.STRING,
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
