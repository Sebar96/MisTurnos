/*
 * Script para generar los iconos PWA de MisTurnos.
 * Crea un icono cuadrado con fondo azul-indigo y las letras "MT" en blanco.
 * Ejecutar: node generate-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Genera un icono PNG válido desde cero, sin dependencias externas.
 * Usa solo módulos nativos de Node.js (fs, zlib).
 *
 * La estructura de un archivo PNG es:
 * 1. Firma PNG (8 bytes)
 * 2. Chunk IHDR ( dimensions, color depth, etc.)
 * 3. Chunk IDAT (datos de la imagen comprimidos con zlib)
 * 4. Chunk IEND (fin del archivo)
 *
 * @param {number} size - Tamaño del icono en píxeles (ej: 192, 512)
 * @param {string} outputPath - Ruta donde guardar el .png
 */
function generateIcon(size, outputPath) {
    const pixels = []; // Array de bytes RGBA (4 bytes por píxel)

    // Colores del icono (formato RGB)
    const bgR = 79, bgG = 70, bgB = 229;   // #4F46E5 (azul-indigo)
    const fgR = 255, fgG = 255, fgB = 255;  // Blanco

    // Definir las letras "MT" como una matriz de píxeles.
    // Cada sub-array es una fila, 1 = píxel pintado, 0 = transparente.
    // Las letras están dibujadas en una grilla de 11x9 píxeles.
    const letterM = [
        [1,0,0,0,0,0,0,0,0,0,1],
        [1,1,0,0,0,0,0,0,0,1,1],
        [1,1,1,0,0,0,0,0,1,1,1],
        [1,1,1,1,0,0,0,1,1,1,1],
        [1,1,0,1,1,0,1,1,0,1,1],
        [1,1,0,0,1,1,1,0,0,1,1],
        [1,1,0,0,0,1,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,1,1],
    ];

    const letterT = [
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [0,0,0,0,0,1,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0],
        [0,0,0,0,0,1,0,0,0,0,0],
    ];

    // Definir la grilla completa del icono (con fondo vacío)
    // Tamaño de la cuadrícula: 25x25 celdas
    const gridSize = 25;
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));

    // Tamaño de cada celda en píxeles
    const cellSize = size / gridSize;

    // Calcular el tamaño de cada letra en celdas
    const mWidth = letterM[0].length;
    const mHeight = letterM.length;
    const tWidth = letterT[0].length;
    const tHeight = letterT.length;
    const gap = 2; // Espacio entre letras

    // Ancho total de las dos letras
    const totalWidth = mWidth + gap + tWidth;

    // Posición inicial (centrado en la grilla)
    const startX = Math.floor((gridSize - totalWidth) / 2);
    const startY = Math.floor((gridSize - mHeight) / 2);

    // Dibujar la letra M en la grilla
    for (let y = 0; y < mHeight; y++) {
        for (let x = 0; x < mWidth; x++) {
            if (letterM[y][x]) {
                grid[startY + y][startX + x] = 1;
            }
        }
    }

    // Dibujar la letra T en la grilla
    for (let y = 0; y < tHeight; y++) {
        for (let x = 0; x < tWidth; x++) {
            if (letterT[y][x]) {
                grid[startY + y][startX + mWidth + gap + x] = 1;
            }
        }
    }

    // Dibujar un borde redondeado (circular)
    // Crear una máscara circular para que el icono sea redondeado
    const center = size / 2;
    const radius = size / 2 - 2; // Un poco más chico que el tamaño total

    // Generar los píxeles RGBA
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // Calcular distancia al centro para el borde redondeado
            const dx = x - center + 0.5;
            const dy = y - center + 0.5;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > radius) {
                // Fuera del círculo: transparente
                pixels.push(0, 0, 0, 0);
            } else {
                // Determinar qué celda de la grilla corresponde a este píxel
                const cellX = Math.floor(x / cellSize);
                const cellY = Math.floor(y / cellSize);

                if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize && grid[cellY][cellX]) {
                    // Píxel de las letras: blanco
                    pixels.push(fgR, fgG, fgB, 255);
                } else {
                    // Fondo: azul-indigo
                    pixels.push(bgR, bgG, bgB, 255);
                }
            }
        }
    }

    // ============================================================
    // ESCRIBIR ARCHIVO PNG
    // ============================================================

    /**
     * Escribe un chunk PNG.
     * Un chunk tiene: 4 bytes de largo + 4 bytes de tipo + datos + 4 bytes de CRC
     */
    function writeChunk(type, data) {
        const typeBuffer = Buffer.from(type, 'ascii');
        const lengthBuffer = Buffer.alloc(4);
        lengthBuffer.writeUInt32BE(data.length, 0);

        // CRC32 se calcula sobre el tipo + datos
        const crcData = Buffer.concat([typeBuffer, data]);
        const crc = crc32(crcData);
        const crcBuffer = Buffer.alloc(4);
        crcBuffer.writeUInt32BE(crc, 0);

        return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
    }

    /**
     * Calcula el CRC32 de un buffer.
     * El CRC32 es un checksum que usa el formato PNG para
     * verificar la integridad de los datos.
     */
    function crc32(buf) {
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < buf.length; i++) {
            crc ^= buf[i];
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
            }
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    // 1. Firma PNG (8 bytes fijos)
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // 2. Chunk IHDR (13 bytes de datos)
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);     // Ancho
    ihdr.writeUInt32BE(size, 4);     // Alto
    ihdr.writeUInt8(8, 8);           // Bit depth (8 bits por canal)
    ihdr.writeUInt8(6, 9);           // Color type (6 = RGBA)
    ihdr.writeUInt8(0, 10);          // Compression (0 = deflate)
    ihdr.writeUInt8(0, 11);          // Filter (0 = none)
    ihdr.writeUInt8(0, 12);          // Interlace (0 = none)

    // 3. Chunk IDAT (datos de imagen)
    // Preparar datos raw: cada fila empieza con byte de filtro (0 = none)
    const rawData = Buffer.alloc(size * (size * 4 + 1));
    let offset = 0;
    for (let y = 0; y < size; y++) {
        rawData[offset++] = 0; // Filtro: none
        for (let x = 0; x < size; x++) {
            const pixelIndex = (y * size + x) * 4;
            rawData[offset++] = pixels[pixelIndex];     // R
            rawData[offset++] = pixels[pixelIndex + 1]; // G
            rawData[offset++] = pixels[pixelIndex + 2]; // B
            rawData[offset++] = pixels[pixelIndex + 3]; // A
        }
    }

    // Comprimir con deflate (nivel 9 = máxima compresión)
    const compressedData = zlib.deflateSync(rawData, { level: 9 });

    // 4. Chunk IEND (sin datos)
    const iend = Buffer.alloc(0);

    // Ensamblar todo el archivo PNG
    const png = Buffer.concat([
        signature,
        writeChunk('IHDR', ihdr),
        writeChunk('IDAT', compressedData),
        writeChunk('IEND', iend)
    ]);

    // Guardar en disco
    fs.writeFileSync(outputPath, png);
    console.log(`  ✓ ${outputPath} (${(png.length / 1024).toFixed(1)} KB, ${size}x${size}px)`);
}

// ============================================================
// GENERAR AMBOS ICONOS
// ============================================================
console.log('Generando iconos PWA para MisTurnos...\n');

const imgDir = path.join(__dirname, 'img');

generateIcon(192, path.join(imgDir, 'icon-192x192.png'));
generateIcon(512, path.join(imgDir, 'icon-512x512.png'));

console.log('\n¡Iconos generados!');
