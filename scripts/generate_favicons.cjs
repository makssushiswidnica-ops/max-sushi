const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAll() {
  const root = path.resolve(__dirname, '..');
  const sourceIcon = path.join(root, 'public', 'icon.png');
  
  // Background color matching the dark interior of the Maks Sushi logo
  const bg = { r: 29, g: 29, b: 27, alpha: 1 };
  
  // 1. Prepare centered emblem scaled to 472x472 (inside 512x512)
  // This leaves ~20px safe breathing margin so Google's circular crop does not clip the red dragon
  const emblemResized = await sharp(sourceIcon)
    .resize(472, 472, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
    
  // 2. Create the master 512x512 solid canvas
  const master512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: bg
    }
  })
  .composite([{ input: emblemResized, gravity: 'center' }])
  .flatten({ background: bg })
  .png({ compressionLevel: 9 })
  .toBuffer();
  
  // 3. Generate 192x192 and 48x48
  const master192 = await sharp(master512).resize(192, 192).png({ compressionLevel: 9 }).toBuffer();
  const master48 = await sharp(master512).resize(48, 48).png({ compressionLevel: 9 }).toBuffer();
  const master32 = await sharp(master512).resize(32, 32).png({ compressionLevel: 9 }).toBuffer();
  const master16 = await sharp(master512).resize(16, 16).png({ compressionLevel: 9 }).toBuffer();
  
  // 4. Generate multi-resolution ICO containing 16x16, 32x32, 48x48
  const icoSizes = [
    { size: 16, buf: master16 },
    { size: 32, buf: master32 },
    { size: 48, buf: master48 }
  ];
  
  const count = icoSizes.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;
  const entries = [];
  for (let i = 0; i < count; i++) {
    const item = icoSizes[i];
    entries.push({
      width: item.size >= 256 ? 0 : item.size,
      height: item.size >= 256 ? 0 : item.size,
      colors: 0,
      reserved: 0,
      planes: 1,
      bpp: 32,
      size: item.buf.length,
      offset: offset,
      data: item.buf
    });
    offset += item.buf.length;
  }
  
  const icoBuffer = Buffer.alloc(offset);
  icoBuffer.writeUInt16LE(0, 0); // reserved
  icoBuffer.writeUInt16LE(1, 2); // type 1 = icon
  icoBuffer.writeUInt16LE(count, 4); // count
  
  for (let i = 0; i < count; i++) {
    const e = entries[i];
    const eOffset = 6 + i * 16;
    icoBuffer.writeUInt8(e.width, eOffset);
    icoBuffer.writeUInt8(e.height, eOffset + 1);
    icoBuffer.writeUInt8(e.colors, eOffset + 2);
    icoBuffer.writeUInt8(e.reserved, eOffset + 3);
    icoBuffer.writeUInt16LE(e.planes, eOffset + 4);
    icoBuffer.writeUInt16LE(e.bpp, eOffset + 6);
    icoBuffer.writeUInt32LE(e.size, eOffset + 8);
    icoBuffer.writeUInt32LE(e.offset, eOffset + 12);
    e.data.copy(icoBuffer, e.offset);
  }
  
  // 5. Write all destination files
  const writes = [
    { file: path.join(root, 'public', 'icon-v2.png'), buf: master512 },
    { file: path.join(root, 'public', 'icon.png'), buf: master512 },
    { file: path.join(root, 'public', 'icon-192.png'), buf: master192 },
    { file: path.join(root, 'public', 'icon-48.png'), buf: master48 },
    { file: path.join(root, 'public', 'favicon.ico'), buf: icoBuffer },
    { file: path.join(root, 'src', 'app', 'icon.png'), buf: master512 },
    { file: path.join(root, 'src', 'app', 'apple-icon.png'), buf: master512 },
    { file: path.join(root, 'src', 'app', 'favicon.ico'), buf: icoBuffer },
  ];
  
  for (const w of writes) {
    fs.writeFileSync(w.file, w.buf);
    console.log('Saved:', path.relative(root, w.file), `(${w.buf.length} bytes)`);
  }
  
  console.log('All favicon and icon assets generated successfully!');
}

generateAll().catch(err => {
  console.error(err);
  process.exit(1);
});
