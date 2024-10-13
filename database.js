// database.js
const { Sequelize, DataTypes } = require('sequelize');
const { Op, fn, col, where } = require('sequelize'); // Убедитесь, что Sequelize импортирован
const path = require('path');
const { app } = require('electron');

// Определяем путь к базе данных
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(app.getPath('userData'), 'content.sqlite'),
  logging: false, // Отключаем логирование SQL-запросов
});

// Определяем модели

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
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

// Функция для инициализации базы данных
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('The connection to the database is established.');
    await sequelize.sync(); // Создаёт таблицы, если они не существуют
    console.log('The models are synchronized.');
  } catch (error) {
    console.error('Error when connecting to the database:', error);
  }
}

function tagCount(length) {
  return sequelize.literal(`COUNT(DISTINCT Tags.id) = ${length}`)
}


async function getTags() {
  try {
    const tags = await Tag.findAll({
      attributes: [
        'name',
        [fn('COUNT', col('Contents.id')), 'contentCount']
      ],
      include: [
        {
          model: Content,
          attributes: [], // Не выбираем никаких атрибутов из Content
        }
      ],
      group: ['Tag.id'],
      having: where(fn('COUNT', col('Contents.id')), '>', 0), // Фильтрация тегов с contentCount > 0
      order: [['name', 'ASC']], // Сортировка по имени тега
    });

    // Преобразуем результат в удобный формат
    return tags.map(tag => ({
      name: tag.name,
      count: tag.get('contentCount'),
    }));
  } catch (error) {
    console.error('Ошибка при получении тегов с количеством контента:', error);
    return [];
  }
}

async function createContent(contentEntity) {
  return await Content.create(contentEntity);
}

async function getContentByTag(value) {
  return await Content.findAll({
    include: {
      model: Tag,
      where: {
        name: value,
      },
      through: {
        attributes: [],
      },
    },
    group: ['Content.id'],
    having: tagCount(value.length),
    order: [['date', 'DESC']],
  });
}

async function getContents(value) {
  return await Content.findAll({
    where: {
      content: {
        [Op.like]: `%${value}%`,
      },
    },
    include: {
      model: Tag,
      through: {
        attributes: [],
      },
    },
    order: [['date', 'DESC']],
  })
}

async function getAllContents() {
  return await Content.findAll({
    include: {
      model: Tag,
      through: {
        attributes: [],
      },
    },
    order: [['date', 'DESC']],
  })
}

async function getContent(id) {
  return await Content.findByPk(id, {
    include: Tag,
  });
}

async function getOrCreateTag(tagEntity) {
  return Tag.findOrCreate({ where: { name: tagEntity } });
}


module.exports = {
  sequelize,
  Content,
  Tag,
  initializeDatabase,
  getTags,
  createContent,
  getContentByTag,
  getContents,
  getAllContents,
  getContent,
  getOrCreateTag
};
