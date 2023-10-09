const Sequelize = require("sequelize");
const dbms = new Sequelize("mms_demo", "ad", "Somnuek2020", {
  host: 'localhost',
  dialect: "mssql",
  dialectOptions: {
    options: {
      instanceName: "SQLEXPRESS",
    },
  },
  timezone: '+07:00'
});
(async () => {
  await dbms.authenticate();
})();
module.exports = dbms;