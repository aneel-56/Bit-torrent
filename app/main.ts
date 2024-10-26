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

    // Parse List
    if (char === "l" || char === "d") {
      const list: any[] = [];
      index++; // Move past 'l'
      // l5:helloi52ee
      // Parse elements within list until "e"
      while (bencodedValue[index] !== "e") {
        const [value, newIndex] = parse(index);
        list.push(value);
        index = newIndex;
      }

      return [list, index + 1]; // Move past 'e'
    }

    // Parse Integer
    if (char === "i") {
      const endIdx = bencodedValue.indexOf("e", index);
      if (endIdx === -1) throw new Error("Invalid bencoded integer");
      const intVal = parseInt(bencodedValue.substring(index + 1, endIdx), 10);
      return [intVal, endIdx + 1];
    }

    // Parse String (length:content format)
    if (!isNaN(Number(char))) {
      const colonIdx = bencodedValue.indexOf(":", index);
      if (colonIdx === -1) throw new Error("Invalid bencoded string");
      const strLen = parseInt(bencodedValue.substring(index, colonIdx), 10);
      const strVal = bencodedValue.substring(
        colonIdx + 1,
        colonIdx + 1 + strLen
      );
      return [strVal, colonIdx + 1 + strLen];
    }

    throw new Error("Unexpected character in bencoded value");
  }

  function parse(index: number): [any, number] {
    const char = bencodedValue[index];
  
    // Parse Dictionary
    if (char === "d") {
      const dict: Record<string, any> = {};  // Initialize an empty object for the dictionary
      index++; // Move past 'd'
  
      // Parse key-value pairs until "e"
      while (bencodedValue[index] !== "e") {
        // Parse the key (must be a string in bencoding)
        const [key, newIndex] = parse(index);
        if (typeof key !== "string") {
          throw new Error("Dictionary keys must be strings in bencoding.");
        }
        
        // Parse the value associated with the key
        const [value, nextIndex] = parse(newIndex);
        dict[key] = value; // Add key-value pair to the dictionary
  
        index = nextIndex; // Update index to continue parsing
      }
  
      return [dict, index + 1]; // Move past 'e' and return the dictionary
    }
  
    // Parse Integer
    if (char === "i") {
      const endIdx = bencodedValue.indexOf("e", index);
      const intVal = parseInt(bencodedValue.substring(index + 1, endIdx), 10);
      return [intVal, endIdx + 1];
    }
  
    // Parse String
    if (!isNaN(Number(char))) {
      const colonIdx = bencodedValue.indexOf(":", index);
      if (colonIdx === -1) throw new Error("Invalid bencoded string");
      const strLen = parseInt(bencodedValue.substring(index, colonIdx), 10);
      const strVal = bencodedValue.substring(colonIdx + 1, colonIdx + 1 + strLen);
      return [strVal, colonIdx + 1 + strLen];
    }
  
    // Parse List
    if (char === "l") {
      const list: any[] = [];
      index++; // Move past 'l'
  
      // Parse elements within list until "e"
      while (bencodedValue[index] !== "e") {
        const [value, newIndex] = parse(index);
        list.push(value);
        index = newIndex;
      }
  
      return [list, index + 1]; // Move past 'e'
    }
  
    throw new Error("Invalid bencoded format");
  }
  const [result] = parse(0);
  return result;
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
