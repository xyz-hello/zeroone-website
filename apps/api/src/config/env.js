function optionalEnv(name, fallback) {
  return process.env[name] ?? fallback;
}

const appConfig = {
  sequelizeCleanDupUniqueIndexes:
    String(optionalEnv('SEQUELIZE_CLEAN_DUP_UNIQUE_INDEXES', 'false')).toLowerCase() === 'true',
  teamPhotoUploadMaxMb: Number(optionalEnv('TEAM_PHOTO_UPLOAD_MAX_MB', '25')),
  geoipDbPath: optionalEnv('GEOIP_DB_PATH', '')
};

module.exports = {
  appConfig,
  optionalEnv
};
