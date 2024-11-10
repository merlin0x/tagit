// Entities.js

const { DataTypes } = require('sequelize');

/**
 * Определяет и настраивает модели Content, Tag и ContentTags.
 * @param {Sequelize} sequelize - Экземпляр Sequelize.
 * @returns {Object} Объект с моделями Content, Tag и ContentTags.
 */
function defineModels(sequelize) {
  // Определение модели Content
  const Content = sequelize.define('Content', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hash: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    }
  }, {
    timestamps: false,
  });

  // Определение модели Tag
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
    isHidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  }, {
    timestamps: false,
  });

  // Определение промежуточной модели ContentTags с дополнительным полем state
  const ContentTags = sequelize.define('ContentTags', {
    state: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  }, {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['contentId', 'tagId'],
      },
    ],
  });


  // Определение связи многие-ко-многим между Content и Tag через ContentTags
  Content.belongsToMany(Tag, { through: ContentTags, foreignKey: 'contentId', otherKey: 'tagId' });
  Tag.belongsToMany(Content, { through: ContentTags, foreignKey: 'tagId', otherKey: 'contentId' });


  return { Content, Tag, ContentTags };
}

module.exports = { defineModels };
