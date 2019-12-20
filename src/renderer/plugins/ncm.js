const CryptoJS = require("crypto-js");
const ID3Writer = require("browser-id3-writer");
const CORE_KEY = CryptoJS.enc.Hex.parse("687a4852416d736f356b496e62617857");
const META_KEY = CryptoJS.enc.Hex.parse("2331346C6A6B5F215C5D2630553C2728");

const audio_mime_type = {
  mp3: "audio/mpeg",
  flac: "audio/flac"
};

export {
  Decrypt
};

async function Decrypt(file) {

  const fileBuffer = file.fileBuffer;

  const dataView = new DataView(fileBuffer);

  if (dataView.getUint32(0, true) !== 0x4e455443 ||
    dataView.getUint32(4, true) !== 0x4d414446
  ) return {
    success: false,
    filename: file.name,
    message: "文件格式不正确",
  };

  let offset = 10;

  const keyData = (() => {
    const keyLen = dataView.getUint32(offset, true);
    offset += 4;
    const cipherText = new Uint8Array(fileBuffer, offset, keyLen).map(
      uint8 => uint8 ^ 0x64
    );
    offset += keyLen;

    const plainText = CryptoJS.AES.decrypt({
        ciphertext: CryptoJS.lib.WordArray.create(cipherText)
      },
      CORE_KEY, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    const result = new Uint8Array(plainText.sigBytes);

    const words = plainText.words;
    const sigBytes = plainText.sigBytes;
    for (let i = 0; i < sigBytes; i++) {
      result[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }


    return result.slice(17);
  })();

  const keyBox = (() => {
    const box = new Uint8Array(Array(256).keys());

    const keyDataLen = keyData.length;

    let j = 0;

    for (let i = 0; i < 256; i++) {
      j = (box[i] + j + keyData[i % keyDataLen]) & 0xff;
      [box[i], box[j]] = [box[j], box[i]];
    }

    return box.map((_, i, arr) => {
      i = (i + 1) & 0xff;
      const si = arr[i];
      const sj = arr[(i + si) & 0xff];
      return arr[(si + sj) & 0xff];
    });
  })();

  /**
   * @typedef {Object} MusicMetaType
   * @property {Number} musicId
   * @property {String} musicName
   * @property {[[String, Number]]} artist
   * @property {String} album
   * @property {"flac"|"mp3"} format
   * @property {String} albumPic
   */

  /** @type {MusicMetaType|undefined} */
  const musicMeta = (() => {
    const metaDataLen = dataView.getUint32(offset, true);
    offset += 4;
    if (metaDataLen === 0) {
      return {};
    }

    const cipherText = new Uint8Array(fileBuffer, offset, metaDataLen).map(
      data => data ^ 0x63
    );
    offset += metaDataLen;

    const plainText = CryptoJS.AES.decrypt({
        ciphertext: CryptoJS.enc.Base64.parse(
          CryptoJS.lib.WordArray.create(cipherText.slice(22)).toString(CryptoJS.enc.Utf8)
        )
      },
      META_KEY, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    );

    const result = JSON.parse(plainText.toString(CryptoJS.enc.Utf8).slice(6));
    result.albumPic = result.albumPic.replace("http:", "https:");

    return result;
  })();

  offset += dataView.getUint32(offset + 5, true) + 13;

  let audioData = new Uint8Array(fileBuffer, offset);
  let audioDataLen = audioData.length;


  for (let cur = 0; cur < audioDataLen; ++cur) {
    audioData[cur] ^= keyBox[cur & 0xff];
  }

  if (musicMeta.format === undefined) {
    const [f, L, a, C] = audioData;
    if (f === 0x66 && L === 0x4c && a === 0x61 && C === 0x43) {
      musicMeta.format = "flac";
    } else {
      musicMeta.format = "mp3";
    }
  }

  const artists = [];
  musicMeta.artist.forEach(arr => {
    artists.push(arr[0]);
  });

  if (musicMeta.format === "mp3") {
    const writer = new ID3Writer(audioData);
    writer.setFrame("TPE1", artists)
      .setFrame("TIT2", musicMeta.musicName)
      .setFrame("TALB", musicMeta.album);
    if (musicMeta.albumPic !== "") {
      try {
        const img = await (await fetch(musicMeta.albumPic)).arrayBuffer();
        writer.setFrame('APIC', {
          type: 3,
          data: img,
          description: 'Cover'
        })
      } catch (e) {
        console.log("Fail to write cover image!");
      }
    }
    writer.addTag();
    audioData = new Uint8Array(writer.arrayBuffer);
  }
  const filename = file.autoRename ? (artists.join(" & ") + " - " + musicMeta.musicName + "." + musicMeta.format) : (file.name + "." + musicMeta.format);
  return {
    success: true,
    filename: filename,
    file: audioData
  };
}
