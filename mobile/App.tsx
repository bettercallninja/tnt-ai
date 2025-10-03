import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	PermissionsAndroid,
	Platform,
	SafeAreaView,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import {
	addPlaybackListener,
	removePlaybackListener,
	startPlayback,
	startRecording,
	stopPlayback,
	stopRecording,
} from './src/recorder';
import {
	getDefaultBaseUrl,
	transcribeAndTranslate,
	TranscribeTranslateResponse,
} from './src/api';

const LANG_OPTIONS = ['English', 'Turkish', 'Persian', 'Arabic'] as const;

type LangOption = (typeof LANG_OPTIONS)[number];

const App = () => {
	const [recording, setRecording] = useState(false);
	const [playing, setPlaying] = useState(false);
	const [audioPath, setAudioPath] = useState<string | null>(null);
	const [targetLangIndex, setTargetLangIndex] = useState(0);
	const [backendUrl, setBackendUrl] = useState(getDefaultBaseUrl());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [response, setResponse] = useState<TranscribeTranslateResponse | null>(null);

	const targetLang = LANG_OPTIONS[targetLangIndex];
	const hasRecording = Boolean(audioPath);

	const playbackActiveRef = useRef(false);

	useEffect(() => {
		const requestPermissions = async () => {
			if (Platform.OS === 'android') {
				await PermissionsAndroid.requestMultiple([
					PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
					PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
					PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
				]);
			}
		};

		void requestPermissions();

		return () => {
			void stopPlayback();
			removePlaybackListener();
		};
	}, []);

	const handleToggleRecording = useCallback(async () => {
		try {
			setError(null);
			if (!recording) {
				const uri = await startRecording();
				setRecording(true);
				setResponse(null);
				setAudioPath(uri);
			} else {
				const uri = await stopRecording();
				setRecording(false);
				setAudioPath(uri);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setError(message);
			setRecording(false);
		}
	}, [recording]);

	const handlePlayback = useCallback(async () => {
		if (!audioPath) {
			setError('Record something first to preview the audio.');
			return;
		}

		if (!playing) {
			try {
				removePlaybackListener();
				setError(null);
				await startPlayback(audioPath);
				setPlaying(true);
				playbackActiveRef.current = true;
			addPlaybackListener((event: any) => {
					if (!playbackActiveRef.current) {
						return;
					}
					if (event.currentPosition >= event.duration) {
						playbackActiveRef.current = false;
						setPlaying(false);
						removePlaybackListener();
					}
				});
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				setError(message);
				setPlaying(false);
			}
		} else {
			await stopPlayback();
			playbackActiveRef.current = false;
			setPlaying(false);
		}
	}, [audioPath, playing]);

	const handleSubmit = useCallback(async () => {
		if (!audioPath) {
			setError('You need to record audio before sending.');
			return;
		}
		if (recording) {
			setError('Stop the recording before sending to the server.');
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const result = await transcribeAndTranslate(audioPath, targetLang, backendUrl);
			setResponse(result);
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [audioPath, backendUrl, recording, targetLang]);

	const cycleTargetLang = useCallback(() => {
		setTargetLangIndex((prev: number) => (prev + 1) % LANG_OPTIONS.length);
	}, []);

	const statusText = useMemo(() => {
		if (recording) return 'Recording… tap to stop.';
		if (playing) return 'Playing preview…';
		if (hasRecording) return 'Ready to preview or send.';
		return 'Tap record to capture audio.';
	}, [hasRecording, playing, recording]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="light-content" />
			<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scroll}>
				<Text style={styles.header}>Offline Speech → Text → Translate</Text>

				<View style={styles.section}>
					<Text style={styles.label}>Backend URL</Text>
					<TextInput
						value={backendUrl}
						onChangeText={setBackendUrl}
						style={styles.input}
						autoCapitalize="none"
						autoCorrect={false}
						placeholder="http://<server>:8000"
					/>
					<Text style={styles.helperText}>
						For Android emulator use 10.0.2.2, for a physical device make sure both phone and server
						are on the same network.
					</Text>
				</View>

						<View style={styles.section}>
							<Text style={styles.label}>Target language</Text>
							<View style={[styles.row, styles.rowBetween]}>
								<Text style={styles.chip}>{targetLang}</Text>
								<TouchableOpacity style={styles.secondaryButton} onPress={cycleTargetLang}>
									<Text style={styles.secondaryButtonText}>Change</Text>
								</TouchableOpacity>
							</View>
						</View>

				<View style={styles.section}>
					<Text style={styles.status}>{statusText}</Text>
								<View style={styles.row}>
									<View style={styles.rowItem}>
										<TouchableOpacity
											style={[styles.button, recording ? styles.buttonDanger : styles.buttonPrimary]}
											onPress={handleToggleRecording}
										>
											<Text style={styles.buttonText}>{recording ? 'Stop' : 'Record'}</Text>
										</TouchableOpacity>
									</View>
									<View style={[styles.rowItem, styles.rowItemLast]}>
										<TouchableOpacity
											style={[styles.button, !hasRecording ? styles.buttonDisabled : styles.buttonSecondary]}
											onPress={handlePlayback}
											disabled={!hasRecording}
										>
											<Text style={[styles.buttonText, !hasRecording && styles.disabledText]}>
												{playing ? 'Stop preview' : 'Preview audio'}
											</Text>
										</TouchableOpacity>
									</View>
								</View>
					<TouchableOpacity
						style={[styles.fullWidthButton, !hasRecording && styles.buttonDisabled]}
						onPress={handleSubmit}
						disabled={!hasRecording || loading}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text style={styles.buttonText}>Send for transcription & translation</Text>
						)}
					</TouchableOpacity>
				</View>

				{error && (
					<View style={[styles.section, styles.errorBox]}>
						<Text style={styles.errorTitle}>Something went wrong</Text>
						<Text style={styles.errorText}>{error}</Text>
					</View>
				)}

				{response && (
					<View style={styles.section}>
						<Text style={styles.label}>Detected language</Text>
						<Text style={styles.resultText}>{response.lang || 'Unknown'}</Text>
						<Text style={[styles.label, styles.spacedLabel]}>Transcript</Text>
						<Text style={styles.resultBox}>{response.transcript || '—'}</Text>
						<Text style={[styles.label, styles.spacedLabel]}>Translation</Text>
						<Text style={styles.resultBox}>{response.translation || '—'}</Text>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#111827',
	},
	scroll: {
		padding: 20,
	},
	header: {
		color: '#f9fafb',
		fontSize: 24,
		fontWeight: '600',
		marginBottom: 16,
	},
	section: {
		backgroundColor: '#1f2937',
		borderRadius: 16,
		padding: 16,
		marginBottom: 20,
	},
	label: {
		color: '#d1d5db',
		fontSize: 14,
		marginBottom: 8,
	},
	spacedLabel: {
		marginTop: 16,
	},
	helperText: {
		color: '#9ca3af',
		fontSize: 12,
		marginTop: 8,
	},
	status: {
		color: '#f3f4f6',
		fontSize: 16,
		marginBottom: 16,
	},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		rowBetween: {
			justifyContent: 'space-between',
		},
		rowItem: {
			flex: 1,
			marginRight: 12,
		},
		rowItemLast: {
			marginRight: 0,
		},
	chip: {
		backgroundColor: '#4b5563',
		color: '#f9fafb',
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 999,
		overflow: 'hidden',
	},
	input: {
		backgroundColor: '#111827',
		color: '#f9fafb',
		borderRadius: 12,
		padding: 12,
		borderWidth: 1,
		borderColor: '#374151',
	},
	button: {
		flex: 1,
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	fullWidthButton: {
		marginTop: 16,
		paddingVertical: 16,
		borderRadius: 12,
		backgroundColor: '#2563eb',
		alignItems: 'center',
	},
	buttonPrimary: {
		backgroundColor: '#ef4444',
	},
	buttonSecondary: {
		backgroundColor: '#2563eb',
	},
	buttonDanger: {
		backgroundColor: '#f59e0b',
	},
	buttonDisabled: {
		backgroundColor: '#374151',
	},
	buttonText: {
		color: '#f9fafb',
		fontWeight: '600',
	},
	disabledText: {
		color: '#9ca3af',
	},
	secondaryButton: {
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderRadius: 10,
		backgroundColor: '#2563eb',
	},
	secondaryButtonText: {
		color: '#f9fafb',
		fontWeight: '500',
	},
	errorBox: {
		borderWidth: 1,
		borderColor: '#f87171',
	},
	errorTitle: {
		color: '#f87171',
		fontWeight: '600',
		marginBottom: 8,
	},
	errorText: {
		color: '#fecaca',
	},
	resultText: {
		color: '#f9fafb',
		fontSize: 16,
	},
	resultBox: {
		color: '#e5e7eb',
		backgroundColor: '#111827',
		borderRadius: 12,
		padding: 12,
		lineHeight: 22,
	},
});

export default App;
