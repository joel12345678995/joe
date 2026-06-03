import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    let variantClasses = ""
    let sizeClasses = ""
    
    if (variant === "default") variantClasses = "bg-blue-600 text-white hover:bg-blue-700"
    if (variant === "outline") variantClasses = "border border-gray-300 bg-white hover:bg-gray-50"
    if (variant === "ghost") variantClasses = "hover:bg-gray-100"
    
    if (size === "default") sizeClasses = "px-4 py-2"
    if (size === "sm") sizeClasses = "px-3 py-1 text-sm"
    if (size === "lg") sizeClasses = "px-6 py-3 text-lg"
    
    return (
      <button
        className={`rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${variantClasses} ${sizeClasses} ${className || ""}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"

export { Button }
