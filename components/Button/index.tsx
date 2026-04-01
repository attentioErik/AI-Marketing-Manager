import styles from './Button.module.css'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?:    Size
  as?:      'button' | 'a'
  href?:    string
}

export default function Button({
  variant = 'primary',
  size    = 'md',
  as      = 'button',
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[variant],
    size !== 'md' ? styles[size] : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  if (as === 'a' && href) {
    return <a href={href} className={cls}>{children}</a>
  }

  return <button className={cls} {...props}>{children}</button>
}
