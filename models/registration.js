// models/Registration.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Registration = sequelize.define(
  "Registration",
  {
    // id: Otomatik olarak Sequelize tarafından eklenecektir.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    // 1. User/Kullanıcı (Foreign Key)
    // Sequelize, bunu otomatik olarak 'UserId' olarak adlandıracaktır.
    // Ancak daha açık olması için 'userId' olarak belirtiyoruz.
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // Bu alanın User tablosuna bağlanacağını varsayıyoruz (İlişki ayarında belirtilecek)
    },

    // 2. Event/Etkinlik (Foreign Key)
    // Sequelize, bunu otomatik olarak 'EventId' olarak adlandıracaktır.
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // Bu alanın Event tablosuna bağlanacağını varsayıyoruz (İlişki ayarında belirtilecek)
    },

    // 3. Ek Bilgiler
    registrationDate: {
      // Kayıt tarihi
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "registrations",
  }
);

module.exports = Registration;
