export const safeParseJSON = (str: string) => {
  try {
    return JSON.parse(str.replace(`\\`, `\/`));
  } catch (e) {
    return str;
  }
};
