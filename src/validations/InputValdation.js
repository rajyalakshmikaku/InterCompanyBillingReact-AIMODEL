
export const allowAlphaNumeric = (value) => {
  return value.replace(/[^a-zA-Z0-9 ]/g, ""); // allows letters, numbers, and spaces
};

export const isAlphaNumeric = (value) => {
  return /^[a-zA-Z0-9 ]*$/.test(value); // returns true if valid
};

