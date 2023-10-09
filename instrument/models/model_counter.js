//Reference
const { Sequelize, DataTypes } = require("sequelize");

//SQL Connection
const icx_database = require("../instance/ms_instance");

//Create Table in SQL
//ชื่อตั่วแปร Const ต้องตรงกับข้างล่าง
const counter_table = icx_database.define(
  "app_counter_accumoutput",
  // table name

  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allownull: false,
      primaryKey: true,
    },
    pin: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    node_no_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  
    accum_output: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    registered_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Mfg_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }
);

//True : Delete then Create
//False : Only Check then Create

//ชื่อตั่วแปร await,module.exports  ต้องตรงกับข้างบน
(async () => {
  await counter_table.sync({ force: false });
})();

module.exports = counter_table;