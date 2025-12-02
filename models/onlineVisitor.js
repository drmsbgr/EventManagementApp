// models/OnlineVisitor.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const OnlineVisitor = sequelize.define(
  "OnlineVisitor",
  {
    // Ziyaretçinin IP Adresi
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Her IP adresi için sadece bir kayıt
    },
    // Son Aktivite Zamanı (ne zaman son istek geldi?)
    lastActive: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    tableName: "online_visitors",
    timestamps: false, // createdAt/updatedAt kullanmıyoruz, lastActive yeterli
  }
);

module.exports = OnlineVisitor;
