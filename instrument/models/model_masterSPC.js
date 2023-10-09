//Reference
const { Sequelize, DataTypes } = require("sequelize");

//SQL Connection
const icx_database = require("../instance/ms_instance");
const masterSPC = icx_database.define('Master_specs', {
  // Model attributes are defined here

  Model: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Part: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Parameter: {
  type: DataTypes.STRING,
  allowNull: false,
  },
  UCL: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }, 
    CL: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }, 
  LCL: {
    type: DataTypes.FLOAT,
    allowNull: false,
  }, 


}
);

(async () => {
await masterSPC.sync({ force: false });
})();

module.exports = masterSPC;