// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
const fs = require("fs");
const crypto = require("crypto");
const axios = require("axios");
interface TorrentInfo {
  announce: string;
  info: {
    length: number;
    name: string;
    "piece length": number;
    pieces: string;
  };
}
interface TrackerResponse {
  interval?: number;
  peers: string | Buffer;
}

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
    if (char === "l") {
      const list: any[] = [];
      index++; // Move past 'l'
      while (bencodedValue[index] !== "e") {
        const [value, newIndex] = parse(index);
        list.push(value);
        index = newIndex;
      }
      return [list, index + 1]; // Move past 'e'
    }

    // Parse Dictionary
    if (char === "d") {
      const dict: Record<string, any> = {}; // Initialize an empty object for the dictionary
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

  const [result] = parse(0);
  return result;
}

function bencode(data: Record<string, any> | string | number): Buffer {
  if (typeof data === "object" && !Array.isArray(data)) {
    let result = "d";
    const keys = Object.keys(data).sort(); // Sort keys alphabetically as per bencoding rules
    for (let key of keys) {
      const value = data[key];
      // console.log((`Key:${key}\n`).toString());
      result += `${key.length}:${key}${bencode(value).toString("binary")}`;
    }
    return Buffer.from(result + "e", "binary");
  } else if (Array.isArray(data)) {
    let result = "l";
    for (let item of data) {
      result += bencode(item).toString("binary");
    }
    return Buffer.from(result + "e", "binary");
  } else if (typeof data === "string") {
    return Buffer.from(`${data.length}:${data}`, "binary");
  } else if (typeof data === "number") {
    return Buffer.from(`i${data}e`, "binary");
  }
  throw new Error("Unsupported data type for bencoding");
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
} else if (args[2] === "info" || args[2] === "peers") {
  const torrentFile = args[3];
  const torrentData = fs.readFileSync(torrentFile).toString("binary");
  const contents = decodeBencode(torrentData) as unknown as TorrentInfo;
  if (torrentData && typeof contents === "object") {
    const announce = contents["announce"];
    const info = contents["info"];
    const length = info?.["length"];
    const pieceLength = info?.["piece length"];
    let pieces = info?.["pieces"];
    // console.log(Buffer.from(pieces).toString("hex"));
    if (typeof announce === "string" && typeof length === "number") {
      // console.log(`Tracker URL: ${announce}`);
      // console.log(`Length: ${length}`);
      const bencodedInfo = bencode(info);
      var infoHash = crypto
        .createHash("sha1")
        .update(bencodedInfo)
        .digest("hex");
      // console.log("Info Hash:", infoHash);
      // console.log("Piece Length:", pieceLength);
      let result: string[] = [];
      for (let pos = 0; pos < pieces.length; pos += 20) {
        result.push(
          Buffer.from(pieces.substring(pos, pos + 20), "binary").toString("hex")
        );
      }
      console.log(result);
    } else {
      console.error("Failed to parse torrent data");
    }
    const trackerUrl = announce;
    const peerId = "AaBbCcDdEeFfGgHhIiJj";
    const port = 6881;
    const uploaded = 0;
    const left = pieceLength;
    const compact = 1;
    const downloaded = 0;
    const infoHashBuffer = Buffer.from(infoHash, "hex"); // Convert hex to Buffer
    const urlEncodedInfoHash = encodeURIComponent(
      infoHashBuffer.toString("binary").slice(0, 20)
    ); // Encode the buffer as binary

    const requestUrl = `${trackerUrl}?info_hash=${urlEncodedInfoHash}&peer_id=${peerId}&port=${port}&uploaded=${uploaded}&downloaded=${downloaded}&left=${left}&compact=${compact}`;
    axios
      .get(requestUrl, { responseType: "arraybuffer" })
      .then((response: { data: any }) => {
        const decodedResponse = decodeBencode(
          response.data.toString("binary")
        ) as unknown as TrackerResponse;
        const peers = Buffer.from(decodedResponse.peers);
        const peerList: string[] = [];
        for (let i = 0; i < peers.length; i += 6) {
          const ip = `${peers[i]}.${peers[i + 1]}.${peers[i + 2]}.${
            peers[i + 3]
          }`;
          const port = (peers[i + 4] << 8) + peers[i + 5];
          peerList.push(`${ip}.${port}`);
        }
        console.log("Peers: ");
        console.log(peerList.join("\n"));
      })
      .catch((error: { message: any }) => {
        console.error(error.message);
      });
  }
}
