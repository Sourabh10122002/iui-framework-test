const {
  IUIWebpackPlugin,
  IUIBuildCSSWebpackPlugin,
  InventiveUiSlotAssetsWebpackPlugin,
  inventiveUiWebpack,
} = require("./inventive-ui-webpack.cjs");

module.exports = {
  IUIWebpackPlugin,
  IUIBuildCSSWebpackPlugin,
  InventiveUiSlotAssetsWebpackPlugin,
  inventiveUiWebpack,
  default: IUIWebpackPlugin,
};
