// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
function decodeBencode(bencodedValue: string): string | number {
  if (bencodedValue[0] === "i") {
    let startIndex = bencodedValue.indexOf("i");
    let endIndex = bencodedValue.indexOf("e");
    if (endIndex === -1) {
      throw new Error("Invalid encoded String");
    } else {
      return parseInt(bencodedValue.slice(startIndex, endIndex));
    }
  }
  if (!isNaN(parseInt(bencodedValue[0]))) {
    const firstColonIndex = bencodedValue.indexOf(":");
    if (firstColonIndex === -1) {
      throw new Error("Invalid encoded value");
    }
    return bencodedValue.substring(firstColonIndex + 1);
  } else {
    throw new Error("Only strings are supported at the moment");
  }
}

const args = process.argv;
const bencodedValue = args[3];

if (args[2] === "decode") {
  try {
    const decoded = decodeBencode(bencodedValue);
    console.log(JSON.stringify(decoded));
  } catch (error: any) {
    console.error(error.message);
  }
}
