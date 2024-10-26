// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
function decodeBencode(bencodedValue: string): string | number | any[] {
  let endIndex = bencodedValue.indexOf("e");
  if (bencodedValue[0] === "i") {
    let startIndex = bencodedValue.indexOf("i");
    if (endIndex === -1) {
      throw new Error("Invalid encoded String");
    } else if (bencodedValue[0] === "i") {
      return parseInt(bencodedValue.substring(startIndex + 1, endIndex));
    }
  }

  function parse(index: number): [any, number] {
    const char = bencodedValue[index];

    if (char === "l") {
      const list: any[] = [];
      index++; //move past 'l'

      while (bencodedValue[index] !== "e") {
        const [value, newIndex] = parse(index);
        list.push(value);
        index = newIndex;
      }
      return [list, index + 1];
    }
    if (char === "i") {
      const endIdx = bencodedValue.indexOf("e", index);
      const intVal = parseInt(bencodedValue.substring(index + 1, endIdx), 10);
      return [intVal, endIdx + 1];
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
