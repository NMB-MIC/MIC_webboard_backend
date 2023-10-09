const Sequelize = require("sequelize");
const sequelize = require("../instance/ms_instance");

const employee = sequelize.define(
  "user",
  {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
       
      },
    employee_id: {
      type: Sequelize.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: {
          args: true,
          msg: "REQUIRED",
        },
      },
    },
    name_eng: {
      type: Sequelize.STRING(40),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          args: true,
          msg: "REQUIRED",
        },
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
  },
    position: {
        type: Sequelize.STRING(80),
        allowNull: true,
    },
    section: {
        type: Sequelize.STRING(80),
        allowNull: true,
    },
    department: {
        type: Sequelize.STRING(80),
        allowNull: true,
    },
    level_sys: {
        type: Sequelize.STRING,
        allowNull: true,
    },


  },
  {
    //options
    freezeTableName: true
  }
);

(async  ()=>{
    await employee.sync({ force: false});
})();

module.exports = employee;