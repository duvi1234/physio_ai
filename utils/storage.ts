import * as SecureStore from 'expo-secure-store';

export async function saveToken(token: string) {
    try {
        await SecureStore.setItemAsync('userToken', token);
    } catch (error) {
        console.error('Error saving token:', error);
    }
}

export async function getToken() {
    try {
        return await SecureStore.getItemAsync('userToken');
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
}

export async function removeToken() {
    try {
        await SecureStore.deleteItemAsync('userToken');
    } catch (error) {
        console.error('Error removing token:', error);
    }
}
