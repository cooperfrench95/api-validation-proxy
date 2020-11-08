module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    }
  },
  lintOnSave: process.env.NODE_ENV !== "production"
};
