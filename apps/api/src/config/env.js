function optionalEnv(name, fallback) {
  return process.env[name] ?? fallback;
}

const appConfig = {
  sequelizeCleanDupUniqueIndexes:
    String(optionalEnv('SEQUELIZE_CLEAN_DUP_UNIQUE_INDEXES', 'false')).toLowerCase() === 'true'
};

module.exports = {
  appConfig,
  optionalEnv
};
