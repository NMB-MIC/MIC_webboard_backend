const Sequelize = require("sequelize");
const sequelize = new Sequelize("mic_JobProgressive ", "sa", "sa@admin", {
  host: "10.121.1.123",
  dialect: "mssql",
  dialectOptions: {
    options: {
      instanceName: "SQLEXPRESS",
    },
  },
});

(async () => {
  await sequelize.authenticate();
})();

module.exports = sequelize;
