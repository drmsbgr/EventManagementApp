// models/User.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const user = sequelize.define(
  "User",
  {
    // Otomatik olarak id alanı eklenecek.
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      // Şifreyi burada HASH'lenmiş olarak tutacağız
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      // Yetkilendirme için Admin/User rolü
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
      allowNull: false,
    },
  },
  {
    // Model ayarları
    tableName: "users",
  }
);

module.exports = user;
