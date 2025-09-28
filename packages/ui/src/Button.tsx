import * as React from 'react';
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'ghost' };
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({variant='primary', className='', ...rest}, ref) => (
  <button ref={ref} {...rest} className={[
    'px-4 py-2 rounded-[var(--radius)]',
    variant==='primary' && 'bg-[var(--fg)] text-[var(--bg)]',
    variant==='secondary' && 'border border-white/15 text-[var(--fg)]',
    variant==='ghost' && 'text-[var(--fg)]',
    className].filter(Boolean).join(' ')} />
));
Button.displayName='Button';
