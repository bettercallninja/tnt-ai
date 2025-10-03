import { Platform } from 'react-native';

export type TranscribeTranslateResponse = {
	transcript: string;
	translation: string;
	lang: string;
};

const DEFAULT_BASE_URL = Platform.select({
	android: 'http://10.0.2.2:8000',
	default: 'http://127.0.0.1:8000',
});

export function getDefaultBaseUrl() {
	return DEFAULT_BASE_URL ?? 'http://127.0.0.1:8000';
}

export async function transcribeAndTranslate(
	audioPath: string,
	targetLang: string,
	baseUrl?: string,
): Promise<TranscribeTranslateResponse> {
	if (!audioPath) {
		throw new Error('No audio recording available.');
	}

	const sanitizedUri = audioPath.startsWith('file://') ? audioPath : `file://${audioPath}`;
	const urlBase = (baseUrl || getDefaultBaseUrl()).replace(/\/$/, '');
	const endpoint = `${urlBase}/v1/transcribe_translate`;

	const formData = new FormData();
	formData.append('target_lang', targetLang);
	formData.append('file', {
		uri: sanitizedUri,
		type: 'audio/mp4',
		name: `recording-${Date.now()}.mp4`,
	} as unknown as Blob);

	const response = await fetch(endpoint, {
		method: 'POST',
		body: formData,
	});

	if (!response.ok) {
		const message = await safeParseError(response);
		throw new Error(message || `Server responded with status ${response.status}`);
	}

	const json = (await response.json()) as TranscribeTranslateResponse;
	return json;
}

async function safeParseError(response: Response): Promise<string | null> {
	try {
		const text = await response.text();
		if (!text) return null;
		try {
			const parsed = JSON.parse(text) as { detail?: unknown };
			if (typeof parsed?.detail === 'string') {
				return parsed.detail;
			}
		} catch {
			// fall back to raw text
		}
		return text;
	} catch {
		return null;
	}
}
