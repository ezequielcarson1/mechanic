import { cn } from '@/lib/utils';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    variant?: 'primary' | 'outline' | 'social';
    size?: 'default' | 'sm' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
}

export function Button({
    className,
    variant = 'primary',
    size = 'default',
    fullWidth = true,
    isLoading = false,
    leftIcon,
    children,
    ...props
}: ButtonProps) {
    return (
        <TouchableOpacity
            className={cn(
                'flex-row items-center justify-center rounded-xl',
                {
                    'bg-blue-600': variant === 'primary',
                    'bg-transparent border border-white/20': variant === 'outline',
                    'bg-white': variant === 'social',
                    'w-full': fullWidth,
                    'px-4 py-3': size === 'default',
                    'px-3 py-2': size === 'sm',
                    'px-6 py-4': size === 'lg',
                },
                className
            )}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'social' ? 'black' : 'white'} />
            ) : (
                <>
                    {leftIcon && <View className="mr-3">{leftIcon}</View>}
                    <Text
                        className={cn('font-outfit-medium text-center', {
                            'text-white': variant === 'primary' || variant === 'outline',
                            'text-black': variant === 'social',
                            'text-base': size === 'default',
                            'text-sm': size === 'sm',
                            'text-lg': size === 'lg',
                        })}
                    >
                        {children}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
}
