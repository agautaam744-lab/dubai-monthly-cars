import React from 'react'

const MockLink = ({ 
  children, 
  href, 
  className, 
  onClick, 
  ...props 
}: { 
  children: React.ReactNode
  href: string
  className?: string
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  [key: string]: any
}) => {
  return (
    <a 
      href={href} 
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </a>
  )
}

export default MockLink