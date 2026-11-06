const fs = require('fs');
const path = require('path');

const sampleRate = 22050;
const duration = 8; // 8 seconds (<15s)
const numSamples = sampleRate * duration;
const buffer = Buffer.alloc(44 + numSamples * 2);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + numSamples * 2, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(numSamples * 2, 40);

// Generate pleasant acoustic chime sequence
const notes = [523.25, 659.25, 783.99, 1046.50, 880.00, 659.25];
for (let i = 0; i < numSamples; i++) {
  const t = i / sampleRate;
  const noteIdx = Math.floor(t / 1.3) % notes.length;
  const freq = notes[noteIdx];
  const noteT = t % 1.3;
  const envelope = Math.exp(-noteT * 3.5);
  const sample = Math.sin(2 * Math.PI * freq * t) * envelope * 0.45;
  buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
}

const outDir = path.resolve(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, 'demo_sunset_chimes.wav');
fs.writeFileSync(outPath, buffer);
console.log('Created:', outPath, 'Bytes:', buffer.length);

