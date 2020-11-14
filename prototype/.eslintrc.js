module.exports = {
  root: true,
  env: {
    node: true
  },
  plugins: [
    "vue-a11y"
  ],
  extends: [
    "plugin:vue/essential",
    "@vue/standard",
    "@vue/typescript/recommended",
    "plugin:vue-a11y/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    quotes: "off",
    semi: "off",
    "space-before-function-paren": "off",
    "brace-style": [1, "stroustrup"],
    "comma-dangle": "off"
  }
};
