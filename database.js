// database.js

const { Sequelize, Op, fn, col, where } = require('sequelize');
const path = require('path');
const { app } = require('electron');
const { defineModels } = require('./Entities');

// Определяем путь к базе данных
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(app.getPath('userData'), 'content.sqlite'),
  logging: false, // Отключаем логирование SQL-запросов
});


const { Content, Tag, ContentTags } = defineModels(sequelize);

/**
 * Инициализирует соединение с базой данных и синхронизирует модели.
 */
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); 
    console.log('Database connected');
  } catch (error) {
    console.error('Ошибка при подключении к базе данных:', error);
  }
}

async function createContentTag(contentTagsData) {
  await sequelize.transaction(async (t) => {
    await ContentTags.bulkCreate(contentTagsData, { transaction: t });  
  });
}

/**
 * Получает все теги с количеством связанного контента.
 */
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

/**
 * Создаёт новый контент.
 * @param {Object} contentEntity - Объект контента.
 */
async function createContent(contentEntity) {
  return Content.create(contentEntity);
}

async function getContentByHash(hash) {
  const content = Content.findOne({
    where: {
      hash: {
        [Op.eq]: hash
      }
    }
  })

  return content;
}

/**
 * Получает контент по названию тега.
 * @param {string} value - Название тега.
 */
async function getContentByTag(value) {
  return Content.findAll({
    include: {
      model: Tag,
      where: {
        name: value,
      },
      through: {
        attributes: ['state'],
      },
    },
    // Если ищем по одному тегу, можно убрать group и having
    // group: ['Content.id'],
    // having: tagCount(1),
    order: [['date', 'DESC']],
  });
}

/**
 * Ищет контент по содержимому.
 * @param {string} value - Строка для поиска.
 */
async function getContents(value) {
  return Content.findAll({
    where: {
      content: {
        [Op.like]: `%${value}%`,
      },
    },
    include: {
      model: Tag,
      through: {
        attributes: ['state'],
      },
    },
    order: [['date', 'DESC']],
  });
}

/**
 * Получает все записи контента.
 */
async function getAllContents() {
  return Content.findAll({
    include: {
      model: Tag,
      through: {
        attributes: ['state'],
      },
    },
    order: [['date', 'DESC']],
  });
}

/**
 * Получает контент по первичному ключу.
 * @param {string} id - Идентификатор контента.
 */
async function getContent(id) {
  return Content.findByPk(id, {
    include: Tag,
  });
}

/**
 * Находит или создаёт тег по названию.
 * @param {string} tagName - Название тега.
 */
async function getOrCreateTag(tagName) {
  return Tag.findOrCreate({ where: { name: tagName } });
}

async function updateContentTagState(contentId, tagName, newState) {
  try {
    // Находим тег по имени
    const tag = await Tag.findOne({ where: { name: tagName } });
    if (!tag) {
      return { success: false, error: `Тег с именем '${tagName}' не найден.` };
    }

    // Находим связь между контентом и тегом
    const contentTag = await ContentTags.findOne({
      where: {
        contentId: contentId,
        tagId: tag.id,
      },
    });

    if (!contentTag) {
      return { success: false, error: `Связь между контентом ID '${contentId}' и тегом '${tagName}' не найдена.` };
    }

    // Обновляем состояние
    contentTag.state = newState;
    await contentTag.save();

    return { success: true };
  } catch (error) {
    console.error('Ошибка при обновлении состояния тега:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  initializeDatabase,
  createContentTag,
  getTags,
  createContent,
  getContentByTag,
  getContents,
  getAllContents,
  getContent,
  getOrCreateTag,
  updateContentTagState,
  getContentByHash
};
