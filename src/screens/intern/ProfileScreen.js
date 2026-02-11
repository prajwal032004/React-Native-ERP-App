import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Toast from 'react-native-toast-message';
import api from '../../config/api';

function ProfileScreen({ navigation }) {
    const { user, logout, updateUser } = useAuth();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState('edit'); // 'edit', 'password', 'photo'

    // Edit Profile Form
    const [formData, setFormData] = useState({
        phone: user?.phone || '',
        address: user?.address || '',
        emergency_contact: user?.emergency_contact || '',
    });

    // Change Password Form
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                phone: user.phone || '',
                address: user.address || '',
                emergency_contact: user.emergency_contact || '',
            });
        }
    }, [user]);

    // ============================================
    // PHOTO UPLOAD FUNCTIONS
    // ============================================

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission', 'We need permission to access your photos');
            return false;
        }
        return true;
    };

    const pickImage = async () => {
        const hasPermission = await requestPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                uploadPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to pick image',
            });
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission', 'We need permission to access your camera');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                uploadPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to take photo',
            });
        }
    };

    const uploadPhoto = async (photoUri) => {
        try {
            setUploadingPhoto(true);

            const response = await fetch(photoUri);
            const blob = await response.blob();
            const base64 = await blobToBase64(blob);

            const uploadResponse = await api.post('/api/intern/profile/upload-photo', {
                photo_data: base64,
            });

            if (uploadResponse.data) {
                const updatedUser = {
                    ...user,
                    photo_url: uploadResponse.data.photo_url,
                };
                await updateUser(updatedUser);

                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Profile photo updated',
                });
            }
        } catch (error) {
            console.error('Upload error:', error);
            Toast.show({
                type: 'error',
                text1: 'Upload Failed',
                text2: error.response?.data?.error || 'Failed to upload photo',
            });
        } finally {
            setUploadingPhoto(false);
        }
    };

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // ============================================
    // UPDATE PROFILE FUNCTIONS
    // ============================================

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);

            const updateResponse = await api.put('/api/intern/profile/update', {
                phone: formData.phone,
                address: formData.address,
                emergency_contact: formData.emergency_contact,
            });

            if (updateResponse.data.user) {
                await updateUser(updateResponse.data.user);
                setModalVisible(false);

                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Profile updated successfully',
                });
            }
        } catch (error) {
            console.error('Update error:', error);
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: error.response?.data?.error || 'Failed to update profile',
            });
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // CHANGE PASSWORD FUNCTIONS
    // ============================================

    const handleChangePassword = async () => {
        // Validation
        if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill all password fields',
            });
            return;
        }

        if (passwordForm.new_password !== passwordForm.confirm_password) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'New passwords do not match',
            });
            return;
        }

        if (passwordForm.new_password.length < 6) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Password must be at least 6 characters',
            });
            return;
        }

        try {
            setLoading(true);

            const response = await api.put('/api/intern/profile', {
                change_password: true,
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                confirm_password: passwordForm.confirm_password,
            });

            if (response.data) {
                setModalVisible(false);
                setPasswordForm({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                });

                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Password changed successfully',
                });
            }
        } catch (error) {
            console.error('Password change error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.response?.data?.error || 'Failed to change password',
            });
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // LOGOUT FUNCTION
    // ============================================

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    onPress: () => { },
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    onPress: async () => {
                        setLoading(true);
                        await logout();
                        setLoading(false);
                        Toast.show({
                            type: 'success',
                            text1: 'Logged out',
                            text2: 'You have been logged out successfully',
                        });
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const showPhotoOptions = () => {
        Alert.alert(
            'Change Profile Photo',
            'Choose how to get a photo',
            [
                {
                    text: 'Take Photo',
                    onPress: takePhoto,
                },
                {
                    text: 'Choose from Gallery',
                    onPress: pickImage,
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    if (!user) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 16,
                backgroundColor: theme.background
            }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{
                    marginTop: 12,
                    fontSize: 16,
                    fontWeight: '500',
                    textAlign: 'center',
                    color: theme.text
                }}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{
                flex: 1,
                paddingHorizontal: 16,
                paddingTop: 16,
                backgroundColor: theme.background
            }}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile Header with Photo Upload */}
            <View style={{
                alignItems: 'center',
                paddingVertical: 32,
                borderRadius: 16,
                marginBottom: 24,
                backgroundColor: theme.surface
            }}>
                <View style={{
                    position: 'relative',
                    marginBottom: 16
                }}>
                    {user.photo_url ? (
                        <Image
                            source={{
                                uri: `https://shramicerp.pythonanywhere.com/uploads/profiles/${user.photo_url}`,
                            }}
                            style={{
                                width: 120,
                                height: 120,
                                borderRadius: 60,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        />
                    ) : (
                        <View style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: theme.primary
                        }}>
                            <MaterialIcons name="person" size={60} color="#FFFFFF" />
                        </View>
                    )}

                    {/* Upload button */}
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 3,
                            borderColor: '#FFFFFF',
                            backgroundColor: theme.primary
                        }}
                        onPress={showPhotoOptions}
                        disabled={uploadingPhoto}
                    >
                        {uploadingPhoto ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <MaterialIcons name="camera-alt" size={20} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    marginBottom: 4,
                    color: theme.text
                }}>
                    {user.full_name}
                </Text>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 12,
                    color: theme.textSecondary
                }}>
                    {user.role}
                </Text>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 6
                }}>
                    <View style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: user.status === 'APPROVED' ? '#10B981' : '#F59E0B'
                    }} />
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: theme.text
                    }}>
                        {user.status}
                    </Text>
                </View>
            </View>

            {/* Info Cards */}
            <View style={{
                marginBottom: 24,
                gap: 12
            }}>
                {/* Intern ID */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderRadius: 12,
                    backgroundColor: theme.surface
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        gap: 12
                    }}>
                        <MaterialIcons name="badge" size={24} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '500',
                                marginBottom: 4,
                                color: theme.textSecondary
                            }}>
                                Intern ID
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: theme.text
                            }}>
                                {user.intern_id}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Email */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderRadius: 12,
                    backgroundColor: theme.surface
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        gap: 12
                    }}>
                        <MaterialIcons name="email" size={24} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '500',
                                marginBottom: 4,
                                color: theme.textSecondary
                            }}>
                                Email
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: theme.text
                            }}>
                                {user.email}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Phone */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderRadius: 12,
                    backgroundColor: theme.surface
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        gap: 12
                    }}>
                        <MaterialIcons name="phone" size={24} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '500',
                                marginBottom: 4,
                                color: theme.textSecondary
                            }}>
                                Phone
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: theme.text
                            }}>
                                {user.phone || 'Not set'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Department */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderRadius: 12,
                    backgroundColor: theme.surface
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        gap: 12
                    }}>
                        <MaterialIcons name="business" size={24} color={theme.primary} />
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '500',
                                marginBottom: 4,
                                color: theme.textSecondary
                            }}>
                                Department
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: theme.text
                            }}>
                                {user.department || 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Address */}
                {user.address && (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 16,
                        paddingVertical: 16,
                        borderRadius: 12,
                        backgroundColor: theme.surface
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                            gap: 12
                        }}>
                            <MaterialIcons name="location-on" size={24} color={theme.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: '500',
                                    marginBottom: 4,
                                    color: theme.textSecondary
                                }}>
                                    Address
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '600',
                                    color: theme.text
                                }}>
                                    {user.address}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View style={{
                marginBottom: 24,
                gap: 12
            }}>
                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1
                    }}
                    onPress={() => {
                        setModalType('edit');
                        setModalVisible(true);
                    }}
                >
                    <MaterialIcons name="edit" size={20} color={theme.primary} />
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.primary
                    }}>
                        Edit Profile
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderWidth: 1
                    }}
                    onPress={() => {
                        setModalType('password');
                        setPasswordForm({
                            current_password: '',
                            new_password: '',
                            confirm_password: '',
                        });
                        setModalVisible(true);
                    }}
                >
                    <MaterialIcons name="lock" size={20} color={theme.primary} />
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.primary
                    }}>
                        Change Password
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: '#EF4444'
                    }}
                    onPress={handleLogout}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <MaterialIcons name="logout" size={20} color="#FFFFFF" />
                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: 16,
                                fontWeight: '600'
                            }}>Logout</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={{
                alignItems: 'center',
                paddingVertical: 16,
                marginBottom: 20
            }}>
                <Text style={{
                    fontSize: 12,
                    fontWeight: '500',
                    color: theme.textSecondary
                }}>
                    Shramic ERP v1.0.0
                </Text>
            </View>

            {/* ============================================ */}
            {/* MODALS */}
            {/* ============================================ */}

            {/* Edit Profile Modal */}
            <Modal visible={modalVisible && modalType === 'edit'} animationType="slide">
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(0,0,0,0.1)'
                    }}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: theme.text
                        }}>Edit Profile</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={{
                        flex: 1,
                        padding: 16
                    }}>
                        {/* Phone */}
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '700',
                            marginBottom: 8,
                            color: theme.text
                        }}>Phone</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                fontSize: 14,
                                backgroundColor: theme.surface,
                                color: theme.text,
                                borderColor: theme.border
                            }}
                            placeholder="Enter phone number"
                            placeholderTextColor={theme.textSecondary}
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            keyboardType="phone-pad"
                            editable={!loading}
                        />

                        {/* Address */}
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '700',
                            marginBottom: 8,
                            marginTop: 16,
                            color: theme.text
                        }}>Address</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                fontSize: 14,
                                backgroundColor: theme.surface,
                                color: theme.text,
                                borderColor: theme.border,
                                height: 100
                            }}
                            placeholder="Enter address"
                            placeholderTextColor={theme.textSecondary}
                            value={formData.address}
                            onChangeText={(text) => setFormData({ ...formData, address: text })}
                            editable={!loading}
                            multiline
                            textAlignVertical="top"
                        />

                        {/* Emergency Contact */}
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '700',
                            marginBottom: 8,
                            marginTop: 16,
                            color: theme.text
                        }}>
                            Emergency Contact
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                fontSize: 14,
                                backgroundColor: theme.surface,
                                color: theme.text,
                                borderColor: theme.border
                            }}
                            placeholder="Enter emergency contact"
                            placeholderTextColor={theme.textSecondary}
                            value={formData.emergency_contact}
                            onChangeText={(text) => setFormData({ ...formData, emergency_contact: text })}
                            editable={!loading}
                        />

                        {/* Save/Cancel Buttons */}
                        <View style={{
                            flexDirection: 'row',
                            gap: 12,
                            marginTop: 24,
                            marginBottom: 40
                        }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border
                                }}
                                onPress={() => setModalVisible(false)}
                                disabled={loading}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: theme.text
                                }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    backgroundColor: theme.primary
                                }}
                                onPress={handleUpdateProfile}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={{
                                        color: '#FFFFFF',
                                        fontSize: 16,
                                        fontWeight: '600'
                                    }}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Change Password Modal */}
            <Modal visible={modalVisible && modalType === 'password'} animationType="slide">
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(0,0,0,0.1)'
                    }}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <MaterialIcons name="close" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: theme.text
                        }}>Change Password</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView style={{
                        flex: 1,
                        padding: 16
                    }}>
                        {/* Current Password */}
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '700',
                            marginBottom: 8,
                            color: theme.text
                        }}>Current Password</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                fontSize: 14,
                                backgroundColor: theme.surface,
                                color: theme.text,
                                borderColor: theme.border
                            }}
                            placeholder="Enter current password"
                            placeholderTextColor={theme.textSecondary}
                            value={passwordForm.current_password}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, current_password: text })}
                            secureTextEntry
                            editable={!loading}
                        />

                        {/* New Password */}
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '700',
                            marginBottom: 8,
                            marginTop: 16,
                            color: theme.text
                        }}>New Password</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                fontSize: 14,
                                backgroundColor: theme.surface,
                                color: theme.text,
                                borderColor: theme.border
                            }}
                            placeholder="Enter new password (min 6 characters)"
                            placeholderTextColor={theme.textSecondary}
                            value={passwordForm.new_password}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, new_password: text })}
                            secureTextEntry
                            editable={!loading}
                        />

                        {/* Confirm Password */}
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '700',
                            marginBottom: 8,
                            marginTop: 16,
                            color: theme.text
                        }}>Confirm Password</Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderRadius: 8,
                                paddingHorizontal: 12,
                                paddingVertical: 10,
                                fontSize: 14,
                                backgroundColor: theme.surface,
                                color: theme.text,
                                borderColor: theme.border
                            }}
                            placeholder="Confirm new password"
                            placeholderTextColor={theme.textSecondary}
                            value={passwordForm.confirm_password}
                            onChangeText={(text) => setPasswordForm({ ...passwordForm, confirm_password: text })}
                            secureTextEntry
                            editable={!loading}
                        />

                        {/* Change/Cancel Buttons */}
                        <View style={{
                            flexDirection: 'row',
                            gap: 12,
                            marginTop: 24,
                            marginBottom: 40
                        }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    borderWidth: 1,
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border
                                }}
                                onPress={() => setModalVisible(false)}
                                disabled={loading}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '600',
                                    color: theme.text
                                }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    backgroundColor: theme.primary
                                }}
                                onPress={handleChangePassword}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={{
                                        color: '#FFFFFF',
                                        fontSize: 16,
                                        fontWeight: '600'
                                    }}>Change Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </ScrollView>
    );
}

export default ProfileScreen;
