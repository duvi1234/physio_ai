import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Calendar, MessageCircle, TrendingUp } from 'lucide-react-native';
import React from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const features = [
    { id: 1, icon: Calendar, text: 'Real-time Scheduling', color: '#00407A' },
    { id: 2, icon: TrendingUp, text: 'Personalized Plans', color: '#00407A' },
    { id: 3, icon: MessageCircle, text: 'Connect with Experts', color: '#00407A' },
];

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <LinearGradient
            colors={['#E0F7FA', '#FFFFFF']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.brandTitle}>SMAART Healthcare</Text>
                    <Text style={styles.brandSubtitle}>Your Partner in Recovery & Wellness</Text>
                </View>

                <View style={styles.content}>
                    <Animated.View
                        entering={FadeInDown.delay(200).duration(800).springify()}
                        style={styles.logoContainer}
                    >
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../../assets/images/logo.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(400).duration(800).springify()}
                        style={styles.textContainer}
                    >
                        <Text style={styles.mainTitle}>Welcome to your{"\n"}Physiotherapy Journey!</Text>

                        <View style={styles.featureGrid}>
                            {features.map((feature, index) => (
                                <Animated.View
                                    key={feature.id}
                                    entering={FadeInDown.delay(500 + (index * 100)).duration(800)}
                                    style={styles.featureCard}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: '#E0F7FA' }]}>
                                        <feature.icon size={20} color={feature.color} />
                                    </View>
                                    <Text style={styles.featureText}>{feature.text}</Text>
                                </Animated.View>
                            ))}
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInUp.delay(800).duration(800).springify()}
                        style={styles.buttonContainer}
                    >
                        <TouchableOpacity
                            style={styles.createButton}
                            onPress={() => router.push('/(auth)/signup' as any)}
                        >
                            <Text style={styles.createButtonText}>Create Account</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => router.push('/(auth)/login' as any)}
                        >
                            <Text style={styles.loginButtonText}>Log In</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00407A',
    },
    brandSubtitle: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 30,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logoCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: '#00407A',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#00407A',
        textAlign: 'center',
        lineHeight: 30,
        marginBottom: 25,
    },
    featureGrid: {
        width: '100%',
        gap: 12,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    featureText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    buttonContainer: {
        width: '100%',
    },
    createButton: {
        backgroundColor: '#00407A',
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: 'transparent',
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#00407A',
    },
    loginButtonText: {
        color: '#00407A',
        fontSize: 18,
        fontWeight: '600',
    },
});
