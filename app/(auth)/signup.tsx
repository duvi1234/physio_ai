import { API_URL } from '@/constants/Api';
import { saveToken } from '@/utils/storage';
import Checkbox from 'expo-checkbox';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Eye, EyeOff, Lock, Mail, ShieldCheck, Smartphone, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SignupScreen() {
    const router = useRouter();
    const [isChecked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profileImage, setProfileImage] = useState<string | null>(null);

    const [form, setForm] = useState({
        fullName: '',
        email: '',
        mobileNumber: '',
        password: '',
        confirmPassword: '',
    });

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need permission to access your gallery.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const handleSignup = async () => {
        if (!isChecked) {
            Alert.alert('Error', 'Please agree to the Terms & Conditions');
            return;
        }

        if (form.password !== form.confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: form.fullName,
                    email: form.email,
                    mobileNumber: form.mobileNumber,
                    password: form.password,
                    // Note: Profile image would normally be uploaded as multipart/form-data
                    // or sent as a base64 string/separate file upload. 
                    // For now we persist it locally if needed.
                }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.token) await saveToken(data.token);
                Alert.alert('Success', 'Account created successfully!', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)' as any) }
                ]);
            } else {
                Alert.alert('Error', data.message || 'Something went wrong');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server. Check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#E0F7FA', '#FFFFFF']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.navbar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color="#00407A" />
                        </TouchableOpacity>
                        <Text style={styles.navTitle}>Create Your Account</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            entering={FadeInDown.duration(800).springify()}
                            style={styles.profileSection}
                        >
                            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                                {profileImage ? (
                                    <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                                ) : (
                                    <Camera size={30} color="#00407A" />
                                )}
                            </TouchableOpacity>
                            <Text style={styles.addPhotoText}>Add Profile Photo</Text>
                        </Animated.View>

                        <Animated.View
                            entering={FadeInDown.delay(200).duration(800).springify()}
                            style={styles.form}
                        >
                            <View style={styles.inputWrapper}>
                                <View style={styles.inputContainer}>
                                    <User size={20} color="#00407A" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Full Name"
                                        placeholderTextColor="#999"
                                        value={form.fullName}
                                        onChangeText={(text) => setForm({ ...form, fullName: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.inputContainer}>
                                    <Mail size={20} color="#00407A" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email Address"
                                        placeholderTextColor="#999"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={form.email}
                                        onChangeText={(text) => setForm({ ...form, email: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.inputContainer}>
                                    <Smartphone size={20} color="#00407A" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mobile Number"
                                        placeholderTextColor="#999"
                                        keyboardType="phone-pad"
                                        value={form.mobileNumber}
                                        onChangeText={(text) => setForm({ ...form, mobileNumber: text })}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.inputContainer}>
                                    <Lock size={20} color="#00407A" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!showPassword}
                                        value={form.password}
                                        onChangeText={(text) => setForm({ ...form, password: text })}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={20} color="#00407A" /> : <Eye size={20} color="#00407A" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputWrapper}>
                                <View style={styles.inputContainer}>
                                    <ShieldCheck size={20} color="#00407A" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#999"
                                        secureTextEntry={!showConfirmPassword}
                                        value={form.confirmPassword}
                                        onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff size={20} color="#00407A" /> : <Eye size={20} color="#00407A" />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.termsRow}>
                                <Checkbox
                                    style={styles.checkbox}
                                    value={isChecked}
                                    onValueChange={setChecked}
                                    color={isChecked ? '#00407A' : undefined}
                                />
                                <Text style={styles.termsText}>
                                    I agree to the <Text style={styles.link}>Terms & Conditions</Text> and <Text style={styles.link}>Privacy Policy</Text>.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.signupButton, loading && { opacity: 0.7 }]}
                                onPress={handleSignup}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.signupButtonText}>Sign Up</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)}>
                                    <Text style={styles.loginLink}>Log In</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
    },
    backButton: {
        padding: 8,
    },
    navTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#00407A',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 30,
        paddingBottom: 20,
    },
    profileSection: {
        alignItems: 'center',
        marginVertical: 10,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#E0F7FA',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    addPhotoText: {
        marginTop: 8,
        fontSize: 12,
        color: '#00407A',
        fontWeight: '600',
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 48,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    termsRow: {
        flexDirection: 'row',
        paddingRight: 20,
        marginTop: 5,
        marginBottom: 15,
    },
    checkbox: {
        marginRight: 10,
        width: 18,
        height: 18,
        borderRadius: 4,
        borderColor: '#00407A',
        marginTop: 2,
    },
    termsText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    link: {
        color: '#00407A',
        fontWeight: '600',
    },
    signupButton: {
        backgroundColor: '#00407A',
        height: 55,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 8,
    },
    signupButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    footerText: {
        fontSize: 14,
        color: '#666',
    },
    loginLink: {
        fontSize: 14,
        color: '#00407A',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
