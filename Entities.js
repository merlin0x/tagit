// Entities.js

const { DataTypes } = require('sequelize');

/**
 * Определяет и настраивает модели Content и Tag.
 * @param {Sequelize} sequelize - Экземпляр Sequelize.
 * @returns {Object} Объект с моделями Content и Tag.
 */
function defineModels(sequelize) {
  const Content = sequelize.define('Content', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    timestamps: false,
  });

  const Tag = sequelize.define('Tag', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  }, {
    timestamps: false,
  });

  // Определяем связь многие-ко-многим между Content и Tag
  Content.belongsToMany(Tag, { through: 'ContentTags', timestamps: false });
  Tag.belongsToMany(Content, { through: 'ContentTags', timestamps: false });

  return { Content, Tag };
}

module.exports = { defineModels };
