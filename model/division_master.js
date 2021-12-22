const { Sequelize, DataTypes } = require("sequelize");
const database = require("../instance/user_instance");

const division = database.define("divison_master", {
  divisionCode: {
    type: Sequelize.STRING,
    primaryKey: true,
    allowNull: false,
    validate: {
      notEmpty: {
        args: true,
        msg: "Required",
      },
      len: {
        args: [4, 4],
        msg: "String length is not in this range (4 digit)",
      },
    },
  },
  divisionName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        args: true,
        msg: "Required",
      },
    },
  },
  PlantCode : {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        args: true,
        msg: "Required",
      },
    },
  },
  updateBy : {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "Admin" ,
    validate: {
      notEmpty: {
        args: true,
        msg: "Required",
      },
      len: {
        args: [4, 6],
        msg: "String length is not in this range",
      },
    },
  },
});

(async () => {
  await division.sync({ force: false });
})();

module.exports = division;
