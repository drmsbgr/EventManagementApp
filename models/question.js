const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const Question = sequelize.define(
  "Question",
  {
    // 1. Foreign Keys (İlişkiler)
    userId: {
      // Soruyu soran kullanıcı ID'si
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    eventId: {
      // Sorunun ait olduğu etkinlik ID'si
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // 2. İçerik
    questionText: {
      // Soru metni
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answerText: {
      // Cevap metni (Admin tarafından eklenecek)
      type: DataTypes.TEXT,
      allowNull: true, // Başlangıçta boş olabilir
    },

    // 3. Durum
    isAnswered: {
      // Sorunun cevaplanıp cevaplanmadığı
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "questions",
  }
);

module.exports = Question;
