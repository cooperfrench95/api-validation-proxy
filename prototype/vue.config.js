module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        appId: 'rest-api-validator', // Do not change this
        productName: 'API Validator',
        linux: {
          target: 'AppImage',
          executableName: 'APIValidator',
          desktop: {
            Type: 'Application',
            Name: 'APIValidator',
            Terminal: false
          },
          category: 'Utilities'
        },
        win: {
          target: 'nsis'
        },
        mac: {
          target: 'default'
        }
      }
    }
  },
  lintOnSave: process.env.NODE_ENV !== "production",
};
