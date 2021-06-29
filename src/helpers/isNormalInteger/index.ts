export default (str: string) => {
  const n = Math.floor(+str);
  return n !== Infinity && String(n) === str && n >= 0;
};
