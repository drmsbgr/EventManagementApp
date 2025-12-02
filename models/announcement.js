// models/Announcement.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Announcement = sequelize.define(
  "Announcement",
  {
    title: {
      // Duyuru Başlığı
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      // Duyuru İçeriği
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isPublished: {
      // Hemen yayınlansın mı?
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    // Bu, Admin'in kim olduğunu takip eder
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Admin silinirse NULL olabilir
    },
  },
  {
    tableName: "announcements",
  }
);

module.exports = Announcement;
