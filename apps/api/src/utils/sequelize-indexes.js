const { sequelize } = require('../config/database');

async function cleanDuplicateUniqueIndexes() {
  if (sequelize.getDialect() !== 'mysql') {
    console.log('Skipping duplicate unique index cleanup for non-MySQL dialect.');
    return;
  }

  const databaseName = sequelize.config.database;
  const [rows] = await sequelize.query(
    `
      SELECT
        TABLE_NAME AS tableName,
        GROUP_CONCAT(INDEX_NAME ORDER BY INDEX_NAME) AS indexNames,
        COUNT(*) AS indexCount
      FROM (
        SELECT
          TABLE_NAME,
          INDEX_NAME,
          GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columnList
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE
          TABLE_SCHEMA = ?
          AND NON_UNIQUE = 0
          AND INDEX_NAME <> 'PRIMARY'
        GROUP BY TABLE_NAME, INDEX_NAME
      ) unique_indexes
      GROUP BY TABLE_NAME, columnList
      HAVING COUNT(*) > 1
    `,
    {
      replacements: [databaseName]
    }
  );

  for (const row of rows) {
    const indexNames = String(row.indexNames || '')
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    const [keepIndexName, ...duplicateIndexNames] = indexNames;

    for (const indexName of duplicateIndexNames) {
      await sequelize.query(
        `ALTER TABLE \`${row.tableName}\` DROP INDEX \`${indexName}\``
      );
      console.log(`Dropped duplicate unique index ${indexName} on ${row.tableName}; kept ${keepIndexName}.`);
    }
  }

  if (!rows.length) {
    console.log('No duplicate unique indexes found.');
  }
}

module.exports = {
  cleanDuplicateUniqueIndexes
};
