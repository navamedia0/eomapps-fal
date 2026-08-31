import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { registerThemedAlertHost, type ThemedAlertButton, type ThemedAlertRequest } from '@/services/themedAlert';
import { GOLD, GOLD_SOFT, NIGHT_DEEP, TEXT_PRIMARY, TEXT_MUTED } from '@/theme/colors';

// App kökünde tek sefer monte edilir — showAlert() çağrıldığı her yerde bu
// modal açılır, RN'in beyaz native Alert.alert()'ünün yerini alır.
export default function ThemedAlertHost() {
  const [request, setRequest] = useState<ThemedAlertRequest | null>(null);

  useEffect(() => {
    registerThemedAlertHost(setRequest);
    return () => registerThemedAlertHost(null);
  }, []);

  if (!request) return null;

  const handlePress = (button: ThemedAlertButton) => {
    setRequest(null);
    button.onPress?.();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setRequest(null)}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setRequest(null)} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{request.title}</Text>
          {!!request.message && <Text style={styles.message}>{request.message}</Text>}

          <View style={styles.buttonsCol}>
            {request.buttons.map((button, index) => (
              <Pressable
                key={index}
                onPress={() => handlePress(button)}
                style={({ pressed }) => [
                  styles.button,
                  index === 0 && styles.buttonFirst,
                  button.style === 'default' && styles.buttonPrimary,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'default' && styles.buttonTextPrimary,
                    button.style === 'destructive' && styles.buttonTextDestructive,
                    button.style === 'cancel' && styles.buttonTextCancel,
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 3, 12, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: NIGHT_DEEP,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    paddingTop: 22,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    color: GOLD,
    textAlign: 'center',
  },
  message: {
    fontSize: 12.5,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  buttonsCol: {
    marginTop: 20,
    marginHorizontal: -20,
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 201, 60, 0.15)',
  },
  buttonFirst: {
    borderTopWidth: 0,
  },
  buttonPrimary: {
    backgroundColor: 'rgba(255, 201, 60, 0.08)',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  buttonTextPrimary: {
    color: GOLD,
  },
  buttonTextDestructive: {
    color: '#E08A8A',
  },
  buttonTextCancel: {
    color: TEXT_MUTED,
    fontWeight: '600',
  },
});
