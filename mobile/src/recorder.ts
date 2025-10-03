import { Platform } from 'react-native';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AVModeIOSOption,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';

const recorder = new AudioRecorderPlayer();
let lastRecordingPath: string | null = null;

export async function startRecording(): Promise<string> {
  const audioSet: AudioSet = {
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    AVModeIOS: AVModeIOSOption.measurement,
    AVNumberOfChannelsKeyIOS: 1,
    AVFormatIDKeyIOS: AVEncodingOption.aac,
    AVSampleRateKeyIOS: 16000,
  };

  const path = Platform.select({
    ios: 'recording.m4a',
    android: undefined,
  });

  const uri = await recorder.startRecorder(path ?? undefined, audioSet);
  lastRecordingPath = uri;
  return uri;
}

export async function stopRecording(): Promise<string> {
  const uri = await recorder.stopRecorder();
  recorder.removeRecordBackListener();
  if (uri) {
    lastRecordingPath = uri;
    return uri;
  }
  if (lastRecordingPath) {
    return lastRecordingPath;
  }
  throw new Error('Recording did not produce a file path.');
}

export async function startPlayback(path: string): Promise<void> {
  const targetPath = path.startsWith('file://') ? path : `file://${path}`;
  await recorder.startPlayer(targetPath);
}

export async function stopPlayback(): Promise<void> {
  await recorder.stopPlayer();
  recorder.removePlayBackListener();
}

export function addPlaybackListener(
  listener: Parameters<AudioRecorderPlayer['addPlayBackListener']>[0],
): void {
  recorder.addPlayBackListener(listener);
}

export function removePlaybackListener(): void {
  recorder.removePlayBackListener();
}
