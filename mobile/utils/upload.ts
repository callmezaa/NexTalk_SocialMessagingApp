import axios from 'axios';
import { Config } from '../constants/Config';
import { useAuthStore } from '../store/authStore';

export const uploadToCloudinary = async (fileUri: string, folder: string = 'general'): Promise<string> => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("Authentication required");

  const formData = new FormData();
  
  // Create file object
  const filename = fileUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename || '');
  const type = match ? `image/${match[1]}` : `image`;

  formData.append('image', {
    uri: fileUri,
    name: filename,
    type,
  } as any);

  try {
    const response = await axios.post(`${Config.API_URL}/upload?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
    });

    return response.data.url;
  } catch (error) {
    console.error("Upload Error:", error);
    throw error;
  }
};

export const uploadAudioToCloudinary = async (fileUri: string, folder: string = 'voice'): Promise<string> => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("Authentication required");

  const formData = new FormData();
  
  const filename = fileUri.split('/').pop() || 'recording.m4a';
  
  formData.append('file', {
    uri: fileUri,
    name: filename,
    type: 'audio/m4a',
  } as any);

  try {
    const response = await axios.post(`${Config.API_URL}/upload/audio?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      },
    });

    return response.data.url;
  } catch (error) {
    console.error("Audio Upload Error:", error);
    throw error;
  }
};

