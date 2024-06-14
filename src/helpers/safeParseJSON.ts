export const safeParseJSON = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    // console.log(str, e)
    return str;
  }
};

export function sanitizeFieldsForJson(data: any) {
  if (typeof data === "object") {
    for (let key in data) {
      data[key] = (typeof data[key] === 'string') ? data[key].replace(/"/g, '\\"') : data[key];
    }
  }

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      data[i] = sanitizeFieldsForJson(data[i]);
    }
  }

  if (typeof data === 'string') {
    data = data.replace(/"/g, '\\"');
  }

  return data;
}
