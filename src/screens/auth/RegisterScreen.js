import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    ScrollView,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function RegisterScreen({ navigation }) {
    const { register } = useAuth();
    const { theme } = useTheme();

    const [formData, setFormData] = useState({
        usn: '',
        full_name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        department: '',
    });

    const [photoUri, setPhotoUri] = useState(null);
    const [photoBase64, setPhotoBase64] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const roles = ['Developer', 'Designer', 'Marketing', 'HR', 'Sales', 'Other'];
    const departments = ['Engineering', 'Design', 'Marketing', 'Human Resources', 'Sales', 'Operations'];

    /* ---------------- IMAGE PICKER ---------------- */
    const pickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Toast.show({ type: 'error', text1: 'Permission Required', text2: 'Allow gallery access' });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
            setPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Toast.show({ type: 'error', text1: 'Permission Required', text2: 'Allow camera access' });
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled) {
            setPhotoUri(result.assets[0].uri);
            setPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    /* ---------------- VALIDATION ---------------- */
    const validateForm = () => {
        const { usn, full_name, phone, email, password, confirmPassword, role, department } = formData;

        if (!usn.trim()) return showError('USN is required');
        if (!full_name.trim()) return showError('Full name is required');
        if (phone.length !== 10) return showError('Enter valid 10-digit phone number');
        if (!email.includes('@')) return showError('Enter valid email address');
        if (password.length < 6) return showError('Password must be at least 6 characters');
        if (password !== confirmPassword) return showError('Passwords do not match');
        if (!role) return showError('Select a role');
        if (!department) return showError('Select a department');

        return true;
    };

    const showError = (msg) => {
        Toast.show({ type: 'error', text1: 'Validation Error', text2: msg });
        return false;
    };

    /* ---------------- REGISTER ---------------- */
    const handleRegister = async () => {
        if (!validateForm()) return;

        setLoading(true);

        const payload = {
            usn: formData.usn.toUpperCase().trim(),
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
            role: formData.role,
            department: formData.department,
            photo_data: photoBase64,
        };

        const result = await register(payload);
        setLoading(false);

        if (result.success) {
            Toast.show({
                type: 'success',
                text1: 'Registration Successful',
                text2: result.message || `Intern ID: ${result.intern_id}`,
            });

            setTimeout(() => {
                navigation.replace('PendingApproval', { email: formData.email });
            }, 1500);
        } else {
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: result.error || 'Something went wrong',
            });
        }
    };

    const update = (k, v) => setFormData(p => ({ ...p, [k]: v }));

    /* ---------------- UI ---------------- */
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
                flex: 1,
                backgroundColor: theme.background
            }}
        >
            <ScrollView
                contentContainerStyle={{ padding: 24 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 28,
                        fontWeight: 'bold',
                        color: theme.text
                    }}>
                        Create Account
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: theme.textSecondary
                    }}>
                        Join Shramic ERP Intern Program
                    </Text>
                </View>

                {/* PHOTO */}
                <View style={{
                    alignItems: 'center',
                    marginBottom: 24
                }}>
                    <TouchableOpacity
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            borderWidth: 2,
                            borderStyle: 'dashed',
                            borderColor: theme.border
                        }}
                        onPress={pickImage}
                        onLongPress={takePhoto}
                    >
                        {photoUri ? (
                            <Image
                                source={{ uri: photoUri }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: 60
                                }}
                            />
                        ) : (
                            <View style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                                <Ionicons name="camera" size={32} color={theme.textSecondary} />
                                <Text style={{
                                    marginTop: 8,
                                    fontWeight: '600',
                                    color: theme.textSecondary
                                }}>
                                    Add Photo
                                </Text>
                                <Text style={{
                                    fontSize: 10,
                                    color: theme.textSecondary
                                }}>
                                    Tap or long press
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* INPUTS */}
                <Input label="USN / ID *" value={formData.usn} onChange={t => update('usn', t)} theme={theme} />
                <Input label="Full Name *" value={formData.full_name} onChange={t => update('full_name', t)} theme={theme} />
                <Input label="Phone *" value={formData.phone} onChange={t => update('phone', t.replace(/\D/g, ''))} theme={theme} keyboard="phone-pad" />
                <Input label="Email *" value={formData.email} onChange={t => update('email', t)} theme={theme} keyboard="email-address" />

                <PasswordInput label="Password *" value={formData.password} onChange={t => update('password', t)} show={showPassword} toggle={() => setShowPassword(!showPassword)} theme={theme} />
                <PasswordInput label="Confirm Password *" value={formData.confirmPassword} onChange={t => update('confirmPassword', t)} show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} theme={theme} />

                <ChipRow title="Role *" items={roles} selected={formData.role} onSelect={v => update('role', v)} theme={theme} />
                <ChipRow title="Department *" items={departments} selected={formData.department} onSelect={v => update('department', v)} theme={theme} />

                <TouchableOpacity
                    style={{
                        height: 56,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: 12,
                        backgroundColor: theme.primary
                    }}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: '600'
                        }}>
                            Register
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={{
                        textAlign: 'center',
                        marginTop: 14,
                        fontWeight: '600',
                        color: theme.primary
                    }}>
                        Already have an account? Login
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

/* ---------------- REUSABLE COMPONENTS ---------------- */
const Input = ({ label, value, onChange, theme, keyboard }) => (
    <>
        <Text style={{
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 6,
            color: theme.text
        }}>
            {label}
        </Text>
        <TextInput
            value={value}
            onChangeText={onChange}
            keyboardType={keyboard}
            style={{
                height: 52,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                marginBottom: 14,
                backgroundColor: theme.surface,
                color: theme.text,
                borderColor: theme.border
            }}
            placeholderTextColor={theme.textSecondary}
        />
    </>
);

const PasswordInput = ({ label, value, onChange, show, toggle, theme }) => (
    <>
        <Text style={{
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 6,
            color: theme.text
        }}>
            {label}
        </Text>
        <View style={{ position: 'relative' }}>
            <TextInput
                value={value}
                onChangeText={onChange}
                secureTextEntry={!show}
                style={{
                    height: 52,
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingRight: 45,
                    marginBottom: 14,
                    backgroundColor: theme.surface,
                    color: theme.text,
                    borderColor: theme.border
                }}
            />
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    right: 16,
                    top: 16
                }}
                onPress={toggle}
            >
                <Ionicons name={show ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
            </TouchableOpacity>
        </View>
    </>
);

const ChipRow = ({ title, items, selected, onSelect, theme }) => (
    <>
        <Text style={{
            fontSize: 14,
            fontWeight: '600',
            marginBottom: 6,
            color: theme.text
        }}>
            {title}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {items.map(i => (
                <TouchableOpacity
                    key={i}
                    onPress={() => onSelect(i)}
                    style={{
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                        borderRadius: 20,
                        marginRight: 8,
                        marginVertical: 8,
                        ...(selected === i
                            ? { backgroundColor: theme.primary }
                            : {
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                                borderWidth: 1
                            })
                    }}
                >
                    <Text style={{
                        color: selected === i ? '#fff' : theme.text
                    }}>
                        {i}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    </>
);
