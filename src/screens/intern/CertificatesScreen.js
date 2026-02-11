import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { certificateService } from '../../services/certificateService';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CertificatesScreen() {
    const { theme } = useTheme();
    const [certificates, setCertificates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCert, setSelectedCert] = useState(null);

    useEffect(() => {
        fetchCertificates();
    }, []);

    const fetchCertificates = async () => {
        try {
            setLoading(true);
            const response = await certificateService.getCertificates();
            const certs = response.data?.certificates || [];
            setCertificates(Array.isArray(certs) ? certs : []);
        } catch (error) {
            console.error('Certificates error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load certificates',
            });
            setCertificates([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Loading certificates...</Text>
                </View>
            </View>
        );
    }

    const CertificateCard = ({ cert, isSelected }) => (
        <TouchableOpacity
            style={[
                styles.certCard,
                isSelected && styles.certCardSelected,
                { backgroundColor: theme?.card || '#fff' }
            ]}
            onPress={() => setSelectedCert(cert)}
            activeOpacity={0.9}
        >
            <View style={styles.certContent}>
                <View style={styles.certInfo}>
                    <Text style={[
                        styles.certTitle,
                        { color: theme?.text || '#111827' }
                    ]}>
                        {cert.certificate_type}
                    </Text>

                    <View style={styles.certNumberContainer}>
                        <Ionicons name="card-outline" size={16} color="#10B981" />
                        <Text style={[
                            styles.certNumber,
                            { color: theme?.primary || '#10B981' }
                        ]}>
                            {cert.certificate_number}
                        </Text>
                    </View>

                    <Text style={[
                        styles.certDate,
                        { color: theme?.textSecondary || '#6B7280' }
                    ]}>
                        Issued {new Date(cert.issue_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Text>
                </View>

                <View style={[
                    styles.certIcon,
                    { backgroundColor: '#10B98108' }
                ]}>
                    <Ionicons name="ribbon-outline" size={28} color="#10B981" />
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme?.background || '#f8f9fa' }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[
                    styles.headerTitle,
                    { color: theme?.text || '#111827' }
                ]}>
                    Certificates
                </Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchCertificates}
                >
                    <Ionicons name="refresh-outline" size={22} color="#10B981" />
                </TouchableOpacity>
            </View>

            {selectedCert ? (
                // Certificate Detail View
                <View style={styles.detailContainer}>
                    <ScrollView
                        style={styles.detailScroll}
                        contentContainerStyle={styles.detailContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Back Header */}
                        <View style={styles.detailHeader}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => setSelectedCert(null)}
                            >
                                <Ionicons name="arrow-back" size={24} color="#10B981" />
                            </TouchableOpacity>
                            <View style={styles.detailHeaderContent}>
                                <Text style={[
                                    styles.detailTitle,
                                    { color: theme?.text || '#111827' }
                                ]}>
                                    {selectedCert.certificate_type}
                                </Text>
                                <Text style={[
                                    styles.detailSubtitle,
                                    { color: theme?.textSecondary || '#6B7280' }
                                ]}>
                                    Certificate #{selectedCert.certificate_number}
                                </Text>
                            </View>
                        </View>

                        {/* Certificate Details */}
                        <View style={[styles.detailsCard, { backgroundColor: theme?.card || '#fff' }]}>
                            <View style={styles.detailSection}>
                                <View style={styles.detailRow}>
                                    <View style={styles.detailIcon}>
                                        <Ionicons name="ribbon-outline" size={24} color="#10B981" />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={[
                                            styles.detailLabel,
                                            { color: theme?.text || '#111827' }
                                        ]}>
                                            Certificate Type
                                        </Text>
                                        <Text style={[
                                            styles.detailValue,
                                            { color: theme?.text || '#111827' }
                                        ]}>
                                            {selectedCert.certificate_type}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <View style={styles.detailIcon}>
                                        <Ionicons name="card-outline" size={24} color="#10B981" />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={[
                                            styles.detailLabel,
                                            { color: theme?.text || '#111827' }
                                        ]}>
                                            Certificate Number
                                        </Text>
                                        <Text style={[
                                            styles.detailValue,
                                            { color: theme?.primary || '#10B981' }
                                        ]}>
                                            {selectedCert.certificate_number}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.detailRow}>
                                    <View style={styles.detailIcon}>
                                        <Ionicons name="calendar-outline" size={24} color="#10B981" />
                                    </View>
                                    <View style={styles.detailContent}>
                                        <Text style={[
                                            styles.detailLabel,
                                            { color: theme?.text || '#111827' }
                                        ]}>
                                            Issue Date
                                        </Text>
                                        <Text style={[
                                            styles.detailValue,
                                            { color: theme?.text || '#111827' }
                                        ]}>
                                            {new Date(selectedCert.issue_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            ) : (
                // Certificates List
                <ScrollView
                    style={styles.listContainer}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {certificates.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="ribbon-outline" size={72} color="#D1D5DB" />
                            </View>
                            <Text style={[
                                styles.emptyTitle,
                                { color: theme?.text || '#111827' }
                            ]}>
                                No certificates earned yet
                            </Text>
                            <Text style={[
                                styles.emptySubtitle,
                                { color: theme?.textSecondary || '#6B7280' }
                            ]}>
                                Complete training modules and projects to receive your first certificate
                            </Text>
                        </View>
                    ) : (
                        certificates.map((cert) => (
                            <CertificateCard
                                key={cert.id}
                                cert={cert}
                                isSelected={selectedCert?.id === cert.id}
                            />
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 28,
    },
    refreshButton: {
        padding: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    certCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    certCardSelected: {
        shadowOpacity: 0.15,
        elevation: 8,
        borderWidth: 2,
        borderColor: '#10B98120',
    },
    certContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    certInfo: {
        flex: 1,
        marginRight: 20,
    },
    certTitle: {
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 24,
        marginBottom: 12,
    },
    certNumberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    certNumber: {
        fontSize: 16,
        fontWeight: '700',
    },
    certDate: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
    },
    certIcon: {
        width: 68,
        height: 68,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailContainer: {
        flex: 1,
    },
    detailScroll: {
        flex: 1,
    },
    detailContent: {
        paddingBottom: 40,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        elevation: 3,
    },
    backButton: {
        padding: 10,
        marginRight: 16,
        borderRadius: 12,
    },
    detailHeaderContent: {
        flex: 1,
    },
    detailTitle: {
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 26,
        marginBottom: 4,
    },
    detailSubtitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    detailsCard: {
        marginHorizontal: 20,
        marginTop: 32,
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    detailSection: {
        gap: 24,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    detailIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#10B98108',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 20,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: '800',
        lineHeight: 24,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 28,
        textAlign: 'center',
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        lineHeight: 22,
        textAlign: 'center',
        color: '#6B7280',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
        textAlign: 'center',
    },
});
