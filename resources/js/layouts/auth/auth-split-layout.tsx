import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { cn } from '@/lib/utils';
import type { AuthLayoutProps, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage<SharedData>().props;

    return (
        <div className="relative flex h-dvh items-center justify-center px-8 bg-[#fafafa] overflow-hidden">
            <AnimatedGridPattern
                width={40}
                height={40}
                numSquares={5}
                maxOpacity={0.25}
                duration={5}
                className={cn(
                    "opacity-45 text-gray-300 [mask-image:radial-gradient(ellipse_at_center,white_0%,white_25%,rgba(255,255,255,0.6)_50%,rgba(255,255,255,0.3)_65%,transparent_85%)]"
                )}
                style={{ transform: 'perspective(1000px) rotateY(-10deg)' }}
            />
            <div className="w-full max-w-[400px] relative z-10">
                <div className="flex flex-col space-y-8">
                    <div className="flex justify-center -mx-20 -mt-20">
                        <img src="/Sacli/Format_3.jpg" alt="Logo" className="w-[500px] object-contain" />
                    </div>
                    <div className="flex flex-col items-center gap-2 mt-5 text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
