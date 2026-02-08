import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 flex items-center gap-3 w-full",
          title: "text-sm font-semibold text-gray-900 dark:text-gray-100",
          description: "text-sm text-gray-600 dark:text-gray-400",
          actionButton: "bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium",
          cancelButton: "bg-muted text-muted-foreground px-3 py-2 rounded-md text-sm font-medium",
          closeButton: "bg-transparent border-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
          success: "text-green-600 dark:text-green-400",
          error: "text-red-600 dark:text-red-400",
          warning: "text-yellow-600 dark:text-yellow-400",
          info: "text-blue-600 dark:text-blue-400",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
