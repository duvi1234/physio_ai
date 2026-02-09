import { getToken } from '@/utils/storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);

    useEffect(() => {
        async function checkToken() {
            const token = await getToken();
            setUserToken(token);
            setIsLoading(false);
        }
        checkToken();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#00407A" />
            </View>
        );
    }

    // If token exists, go to tabs, else go to auth
    if (userToken) {
        return <Redirect href={"/(tabs)" as any} />;
    }

    return <Redirect href={"/(auth)/welcome" as any} />;
}
