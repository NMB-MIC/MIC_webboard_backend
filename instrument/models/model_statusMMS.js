//Reference
const { Sequelize, DataTypes } = require("sequelize");

//SQL Connection
const icx_database = require("../instance/ms_instance");

//Create Table in SQL
//ชื่อตั่วแปร Const ต้องตรงกับข้างล่าง
const status_table = icx_database.define(
  "mc_status",
  // table name

  {
    registered_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    occurred: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mc_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mc_status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }
);

//True : Delete then Create
//False : Only Check then Create

//ชื่อตั่วแปร await,module.exports  ต้องตรงกับข้างบน
(async () => {
  await status_table.sync({ force: false });
})();

module.exports = status_table;
