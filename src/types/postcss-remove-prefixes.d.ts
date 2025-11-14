declare module 'postcss-remove-prefixes' {
  import { PluginCreator } from 'postcss';
  const removePrefixes: PluginCreator<void>;
  export default removePrefixes;
}
