// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
function decodeBencode(bencodedValue: string): string | number | string[] {
  let endIndex = bencodedValue.indexOf("e");
  if (bencodedValue[0] === "i") {
    let startIndex = bencodedValue.indexOf("i");
    if (endIndex === -1) {
      throw new Error("Invalid encoded String");
    } else if (bencodedValue[0] === "i") {
      return parseInt(bencodedValue.substring(startIndex + 1, endIndex));
    }
  }
  if (bencodedValue[0] === "l") {
    const endIndex = bencodedValue.indexOf("e");
    let index = bencodedValue.indexOf(":");
    let res = [];
    while (index < endIndex) {
      let j = index + 1;
      if (bencodedValue[j] === "i") {
        res.push(
          bencodedValue.substring(bencodedValue.indexOf(":") + 1),
          bencodedValue.indexOf("i")
        );
      }
      if (bencodedValue[j] === "e") {
        res.push(
          bencodedValue.substring(bencodedValue.indexOf("i") + 1),
          bencodedValue.indexOf("e")
        );
      }
      j++;
      index++;
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
function indexOf(arg0: string): number | undefined {
  throw new Error("Function not implemented.");
}
