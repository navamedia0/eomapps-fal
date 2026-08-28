import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple } from '@/services/auth';

type Props = {
  onSuccess: () => void;
  onError: (message: string) => void;
};

export default function AppleSignInButton({ onSuccess, onError }: Props) {
  if (Platform.OS !== 'ios') return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
      cornerRadius={12}
      style={{ height: 46, width: '100%', marginTop: 10 }}
      onPress={async () => {
        try {
          await signInWithApple();
          onSuccess();
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === 'ERR_REQUEST_CANCELED') return;
          onError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.');
        }
      }}
    />
  );
}
