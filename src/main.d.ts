declare module 'change-object-case' {
  export type changeableCase = Object | String;
  export function camelCase<changeableCase>(arg: changeableCase): changeableCase;
  export function snakeCase<changeableCase>(arg: changeableCase): changeableCase;
};
