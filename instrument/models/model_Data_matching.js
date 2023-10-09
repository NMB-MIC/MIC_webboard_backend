//Reference
const { Sequelize, DataTypes } = require("sequelize");

//SQL Connection
const icx_database = require("../instance/ms_instance");
const Data = icx_database.define("Data_matchings", {
  // Model attributes are defined here

  Timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  Model: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Part: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Line: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Oil_Top_Data: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  Oil_Bottom_Data: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  Axial_Play_Data: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

(async () => {
  await Data.sync({ force: false });
})();

module.exports = Data;
