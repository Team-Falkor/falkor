import { existsSync, readFileSync } from "node:fs";
import { Readable } from "node:stream";
import decode from "audio-decode";
import Speaker from "speaker";

/**
 * Plays an audio file (wav, mp3, ogg, flac, etc.) in-process.
 * Your app will appear in the mixer.
 * @param soundPath Absolute path to the audio file
 */
export async function playSound(soundPath: string): Promise<void> {
	if (!existsSync(soundPath)) {
		throw new Error(`Sound file does not exist: ${soundPath}`);
	}

	// Read file into a buffer
	const buffer = readFileSync(soundPath);

	// Decode audio (returns AudioBuffer)
	const audioBuffer = await decode(buffer);

	// Prepare Speaker
	const speaker = new Speaker({
		channels: audioBuffer.numberOfChannels,
		bitDepth: 16,
		sampleRate: audioBuffer.sampleRate,
	});

	// Interleave and convert to 16-bit PCM
	const interleaved = interleaveAndConvert(audioBuffer);

	// Create a readable stream from the PCM buffer
	const stream = Readable.from(interleaved);

	return new Promise((resolve, reject) => {
		stream.pipe(speaker);
		speaker.on("close", resolve);
		speaker.on("error", reject);
		stream.on("error", reject);
	});
}

/**
 * Converts AudioBuffer to interleaved 16-bit PCM Buffer
 */
function interleaveAndConvert(audioBuffer: AudioBuffer): Buffer {
	const { numberOfChannels, length } = audioBuffer;
	const output = Buffer.alloc(length * numberOfChannels * 2); // 16-bit PCM

	for (let i = 0; i < length; i++) {
		for (let ch = 0; ch < numberOfChannels; ch++) {
			let sample = audioBuffer.getChannelData(ch)[i];
			// Clamp and convert to 16-bit signed integer
			sample = Math.max(-1, Math.min(1, sample));
			output.writeInt16LE(sample * 0x7fff, (i * numberOfChannels + ch) * 2);
		}
	}
	return output;
}
