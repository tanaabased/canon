export default function findNamed(values, name) {
  return values.find((value) => value.name.toLowerCase() === name.toLowerCase());
}
